import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_tenant_id
from app.db.session import get_db
from app.models.calendar import Appointment
from app.models.user import User
from app.schemas.calendar import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentDragDrop,
)

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/appointments", response_model=list[AppointmentResponse])
async def list_appointments(
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    assigned_to: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Appointment).where(Appointment.tenant_id == tenant_id)
    # Overlap query: show appointments that overlap with the requested time window
    # This correctly handles multi-day appointments
    if start:
        query = query.where(Appointment.end_time >= start)
    if end:
        query = query.where(Appointment.start_time <= end)
    if assigned_to:
        query = query.where(Appointment.assigned_to == assigned_to)
    if status:
        query = query.where(Appointment.status == status)
    query = query.order_by(Appointment.start_time)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    data: AppointmentCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    dump = data.model_dump()
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
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: uuid.UUID,
    data: AppointmentUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404)

    update_data = data.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        update_data["meta_data"] = update_data.pop("metadata")

    for field, value in update_data.items():
        setattr(appointment, field, value)

    # Auto-detect multi-day on update
    if appointment.start_time and appointment.end_time:
        appointment.is_multi_day = appointment.start_time.date() != appointment.end_time.date()

    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.patch("/appointments/{appointment_id}/move", response_model=AppointmentResponse)
async def drag_drop_appointment(
    appointment_id: uuid.UUID,
    data: AppointmentDragDrop,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Drag-and-drop rescheduling endpoint."""
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404)

    appointment.start_time = data.start_time
    appointment.end_time = data.end_time
    appointment.is_multi_day = data.start_time.date() != data.end_time.date()

    await db.commit()
    await db.refresh(appointment)
    return appointment


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
