from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.calendar import AppointmentStatus, AppointmentPriority


class AppointmentCreate(BaseModel):
    title: str
    description: str | None = None
    customer_id: UUID | None = None
    assigned_to_ids: list[UUID] = []       # M2M assignees
    project_id: UUID | None = None
    vehicle_id: UUID | None = None
    location_id: UUID | None = None
    contact_person_id: UUID | None = None
    rental_car_id: UUID | None = None
    rental_car_needed: bool = False
    start_time: datetime
    end_time: datetime
    is_multi_day: bool = False
    order_number: str | None = None
    color: str | None = None
    status: AppointmentStatus = AppointmentStatus.OPEN
    priority: AppointmentPriority = AppointmentPriority.MEDIUM
    location_text: str | None = None
    metadata: dict | None = None
    needs_scan: bool = False


class AppointmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    customer_id: UUID | None = None
    assigned_to_ids: list[UUID] | None = None
    vehicle_id: UUID | None = None
    location_id: UUID | None = None
    contact_person_id: UUID | None = None
    rental_car_id: UUID | None = None
    rental_car_needed: bool | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_multi_day: bool | None = None
    order_number: str | None = None
    color: str | None = None
    status: AppointmentStatus | None = None
    priority: AppointmentPriority | None = None
    location_text: str | None = None
    metadata: dict | None = None
    needs_scan: bool | None = None


class AppointmentResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    title: str
    description: str | None
    customer_id: UUID | None
    assigned_to: UUID | None          # Legacy single FK
    assigned_to_ids: list[UUID] = []  # M2M resolved
    assigned_to_names: list[str] = [] # Resolved full_name list
    project_id: UUID | None
    vehicle_id: UUID | None
    location_id: UUID | None
    contact_person_id: UUID | None
    rental_car_id: UUID | None
    rental_car_needed: bool
    start_time: datetime
    end_time: datetime
    is_multi_day: bool
    order_number: str | None
    color: str | None
    status: AppointmentStatus
    priority: AppointmentPriority
    location_text: str | None
    metadata: dict | None
    needs_scan: bool = False
    scan_notified: bool = False
    scan_job_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppointmentDragDrop(BaseModel):
    """For drag-and-drop rescheduling."""
    start_time: datetime
    end_time: datetime


class TeamMemberResponse(BaseModel):
    id: UUID
    full_name: str
    email: str

    model_config = {"from_attributes": True}
