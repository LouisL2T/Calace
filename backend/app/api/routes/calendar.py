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
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Appointment).where(Appointment.tenant_id == tenant_id)
    if start:
        query = query.where(Appointment.start_time >= start)
    if end:
        query = query.where(Appointment.end_time <= end)
    if assigned_to:
        query = query.where(Appointment.assigned_to == assigned_to)
    query = query.order_by(Appointment.start_time)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    data: AppointmentCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    appointment = Appointment(tenant_id=tenant_id, **data.model_dump())
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

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)

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
