from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.calendar import AppointmentStatus


class AppointmentCreate(BaseModel):
    title: str
    description: str | None = None
    customer_id: UUID | None = None
    assigned_to: UUID | None = None
    project_id: UUID | None = None
    start_time: datetime
    end_time: datetime
    color: str | None = None
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    metadata: dict | None = None


class AppointmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    customer_id: UUID | None = None
    assigned_to: UUID | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    color: str | None = None
    status: AppointmentStatus | None = None
    metadata: dict | None = None


class AppointmentResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    title: str
    description: str | None
    customer_id: UUID | None
    assigned_to: UUID | None
    project_id: UUID | None
    start_time: datetime
    end_time: datetime
    color: str | None
    status: AppointmentStatus
    metadata: dict | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppointmentDragDrop(BaseModel):
    """For drag-and-drop rescheduling."""
    start_time: datetime
    end_time: datetime
