from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ChecklistPhotoResponse(BaseModel):
    id: UUID
    checklist_id: UUID
    photo_type: str
    file_url: str
    file_name: str | None
    mime_type: str | None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ChecklistCreate(BaseModel):
    assigned_to: UUID | None = None
    notes: str | None = None


class ChecklistUpdate(BaseModel):
    status: str | None = None
    mileage: int | None = None
    fault_codes: str | None = None
    notes: str | None = None
    assigned_to: UUID | None = None


class ChecklistResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    appointment_id: UUID
    assigned_to: UUID | None
    status: str
    mileage: int | None
    fault_codes: str | None
    notes: str | None
    created_at: datetime
    completed_at: datetime | None
    photos: list[ChecklistPhotoResponse] = []

    model_config = {"from_attributes": True}
