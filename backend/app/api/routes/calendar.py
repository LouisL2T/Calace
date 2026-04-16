import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_tenant_id
from app.db.session import get_db
from app.models.calendar import Appointment, AppointmentAssignee, AppointmentPriority
from app.models.notification import Notification
from app.models.user import User, TenantMember, UserRole
from app.schemas.calendar import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    AppointmentDragDrop, TeamMemberResponse,
)
from app.services.adi_client import create_adi_scan_job

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _build_response(appointment: Appointment) -> dict:
    """Build AppointmentResponse dict with resolved M2M assignees."""
    ids = [a.user_id for a in (appointment.assignees or [])]
    names = [a.user.full_name for a in (appointment.assignees or []) if a.user]
    return AppointmentResponse(
        id=appointment.id,
        tenant_id=appointment.tenant_id,
        title=appointment.title,
        description=appointment.description,
        customer_id=appointment.customer_id,
        assigned_to=appointment.assigned_to,
        assigned_to_ids=ids,
        assigned_to_names=names,
        project_id=appointment.project_id,
        vehicle_id=appointment.vehicle_id,
        location_id=appointment.location_id,
        contact_person_id=appointment.contact_person_id,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        is_multi_day=appointment.is_multi_day,
        order_number=appointment.order_number,
        color=appointment.color,
        status=appointment.status,
        priority=appointment.priority,
        location_text=appointment.location_text,
        metadata=appointment.meta_data,
        needs_scan=appointment.needs_scan,
        scan_notified=appointment.scan_notified,
        scan_job_id=appointment.scan_job_id,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at,
    )


async def _notify_scanner_operators(
    appointment: Appointment,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Erstellt In-App-Benachrichtigungen für alle Scanner-Operator-Nutzer des Tenants."""
    # Alle Tenant-Mitglieder mit scanner_operator-Rolle suchen
    result = await db.execute(
        select(TenantMember).where(
            TenantMember.tenant_id == tenant_id,
            TenantMember.role == UserRole.SCANNER_OPERATOR,
        )
    )
    operators = result.scalars().all()

    for member in operators:
        notification = Notification(
            tenant_id=tenant_id,
            user_id=member.user_id,
            appointment_id=appointment.id,
            type="scan_request",
            title="Neuer Scan-Auftrag",
            body=f'Fahrzeug-Scan erforderlich für Auftrag: {appointment.title}',
            is_read=False,
        )
        db.add(notification)


@router.get("/appointments", response_model=list[AppointmentResponse])
async def list_appointments(
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    assigned_to: uuid.UUID | None = Query(None),
    customer_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    needs_scan: bool | None = Query(None),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Appointment)
        .options(selectinload(Appointment.assignees).selectinload(AppointmentAssignee.user))
        .where(Appointment.tenant_id == tenant_id)
    )
    # Overlap query: show appointments that overlap with the requested time window
    if start:
        query = query.where(Appointment.end_time >= start)
    if end:
        query = query.where(Appointment.start_time <= end)
    if assigned_to:
        # Filter by M2M assignee
        query = query.where(
            Appointment.id.in_(
                select(AppointmentAssignee.appointment_id).where(AppointmentAssignee.user_id == assigned_to)
            )
        )
    if customer_id:
        query = query.where(Appointment.customer_id == customer_id)
    if status:
        query = query.where(Appointment.status == status)
    if priority:
        query = query.where(Appointment.priority == priority)
    if needs_scan is not None:
        query = query.where(Appointment.needs_scan == needs_scan)

    query = query.order_by(Appointment.start_time)
    result = await db.execute(query)
    appointments = result.scalars().unique().all()
    return [_build_response(a) for a in appointments]


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    data: AppointmentCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    dump = data.model_dump(exclude={"assigned_to_ids"})
    # Map 'metadata' key to 'meta_data' column name
    if "metadata" in dump:
        dump["meta_data"] = dump.pop("metadata")
    # Auto-detect multi-day
    if dump.get("start_time") and dump.get("end_time"):
        start_date = dump["start_time"].date() if hasattr(dump["start_time"], "date") else dump["start_time"]
        end_date = dump["end_time"].date() if hasattr(dump["end_time"], "date") else dump["end_time"]
        if start_date != end_date:
            dump["is_multi_day"] = True

    appointment = Appointment(tenant_id=tenant_id, **dump)
    db.add(appointment)
    await db.flush()  # Get the appointment ID

    # Create M2M assignees
    for user_id in (data.assigned_to_ids or []):
        assignee = AppointmentAssignee(appointment_id=appointment.id, user_id=user_id)
        db.add(assignee)
        # Also set legacy assigned_to to the first user for backward compat
        if not appointment.assigned_to:
            appointment.assigned_to = user_id

    # Scanner-Operator-Workflow
    if data.needs_scan:
        await _notify_scanner_operators(appointment, tenant_id, db)
        appointment.scan_notified = True

    await db.commit()

    # ADI-Schnittstelle: Scan-Auftrag asynchron erstellen (fire-and-forget)
    if data.needs_scan:
        try:
            job_id = await create_adi_scan_job(appointment)
            if job_id:
                appointment.scan_job_id = job_id
                await db.commit()
        except Exception:
            pass  # Fehler wird im adi_client geloggt, blockiert nicht

    # Re-fetch with relationships
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.assignees).selectinload(AppointmentAssignee.user))
        .where(Appointment.id == appointment.id)
    )
    appointment = result.scalar_one()
    return _build_response(appointment)


@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: uuid.UUID,
    data: AppointmentUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.assignees))
        .where(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404)

    update_data = data.model_dump(exclude_unset=True, exclude={"assigned_to_ids"})
    if "metadata" in update_data:
        update_data["meta_data"] = update_data.pop("metadata")

    # Check if needs_scan is being turned ON for the first time
    scan_just_enabled = (
        data.needs_scan is True
        and not appointment.needs_scan
        and not appointment.scan_notified
    )

    for field, value in update_data.items():
        setattr(appointment, field, value)

    # Auto-detect multi-day on update
    if appointment.start_time and appointment.end_time:
        appointment.is_multi_day = appointment.start_time.date() != appointment.end_time.date()

    # Update M2M assignees if provided
    if data.assigned_to_ids is not None:
        # Remove old assignees
        for old in list(appointment.assignees):
            await db.delete(old)
        # Add new assignees
        appointment.assigned_to = None
        for user_id in data.assigned_to_ids:
            assignee = AppointmentAssignee(appointment_id=appointment.id, user_id=user_id)
            db.add(assignee)
            if not appointment.assigned_to:
                appointment.assigned_to = user_id

    if scan_just_enabled:
        await _notify_scanner_operators(appointment, tenant_id, db)
        appointment.scan_notified = True

    await db.commit()

    if scan_just_enabled:
        try:
            job_id = await create_adi_scan_job(appointment)
            if job_id:
                appointment.scan_job_id = job_id
                await db.commit()
        except Exception:
            pass

    # Re-fetch with relationships
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.assignees).selectinload(AppointmentAssignee.user))
        .where(Appointment.id == appointment.id)
    )
    appointment = result.scalar_one()
    return _build_response(appointment)


@router.patch("/appointments/{appointment_id}/move", response_model=AppointmentResponse)
async def drag_drop_appointment(
    appointment_id: uuid.UUID,
    data: AppointmentDragDrop,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Drag-and-drop rescheduling endpoint."""
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.assignees).selectinload(AppointmentAssignee.user))
        .where(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404)

    appointment.start_time = data.start_time
    appointment.end_time = data.end_time
    appointment.is_multi_day = data.start_time.date() != data.end_time.date()

    await db.commit()
    await db.refresh(appointment)
    return _build_response(appointment)


@router.delete("/appointments/{appointment_id}")
async def delete_appointment(
    appointment_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404)
    await db.delete(appointment)
    await db.commit()
    return {"ok": True}


@router.get("/team-members", response_model=list[TeamMemberResponse])
async def list_team_members(
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """List all users belonging to the current tenant for the assignee dropdown."""
    result = await db.execute(
        select(User)
        .join(TenantMember, TenantMember.user_id == User.id)
        .where(TenantMember.tenant_id == tenant_id, User.is_active == True)
        .order_by(User.full_name)
    )
    return result.scalars().all()


@router.get("/saved-views")
async def list_saved_views(
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gespeicherte Kalender-Ansichten abrufen (per Tenant-Settings gespeichert)."""
    from app.models.user import Tenant
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        return []
    settings = tenant.settings or {}
    return settings.get("saved_calendar_views", [])


@router.post("/saved-views")
async def save_view(
    view: dict,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Kalender-Ansicht speichern."""
    from app.models.user import Tenant
    import time
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404)

    settings = dict(tenant.settings or {})
    views = list(settings.get("saved_calendar_views", []))
    view["id"] = view.get("id") or str(uuid.uuid4())
    # Upsert by id
    views = [v for v in views if v.get("id") != view["id"]]
    views.append(view)
    settings["saved_calendar_views"] = views
    tenant.settings = settings
    await db.commit()
    return view


@router.delete("/saved-views/{view_id}")
async def delete_saved_view(
    view_id: str,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gespeicherte Kalender-Ansicht löschen."""
    from app.models.user import Tenant
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404)

    settings = dict(tenant.settings or {})
    views = [v for v in settings.get("saved_calendar_views", []) if v.get("id") != view_id]
    settings["saved_calendar_views"] = views
    tenant.settings = settings
    await db.commit()
    return {"ok": True}
