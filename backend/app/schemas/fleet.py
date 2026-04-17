from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.models.fleet import RentalCarStatus, RentalCarTransmission

class RentalCarBase(BaseModel):
    name: str
    make: str | None = None
    model: str | None = None
    license_plate: str | None = None
    vehicle_class: str | None = None
    doors: int | None = None
    transmission: RentalCarTransmission | None = None
    status: RentalCarStatus = RentalCarStatus.AVAILABLE
    notes: str | None = None

class RentalCarCreate(RentalCarBase):
    pass

class RentalCarUpdate(BaseModel):
    name: str | None = None
    make: str | None = None
    model: str | None = None
    license_plate: str | None = None
    vehicle_class: str | None = None
    doors: int | None = None
    transmission: RentalCarTransmission | None = None
    status: RentalCarStatus | None = None
    notes: str | None = None

class RentalCarResponse(RentalCarBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
