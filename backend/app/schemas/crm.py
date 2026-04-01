from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    address: str | None = None
    custom_fields: dict | None = None


class CustomerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    address: str | None = None
    custom_fields: dict | None = None


class CustomerResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    first_name: str
    last_name: str
    email: str | None
    phone: str | None
    company: str | None
    address: str | None
    custom_fields: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class VehicleCreate(BaseModel):
    customer_id: UUID
    make: str | None = None
    model: str | None = None
    year: str | None = None
    license_plate: str | None = None
    vin: str | None = None
    color: str | None = None
    extra_data: dict | None = None


class VehicleResponse(BaseModel):
    id: UUID
    customer_id: UUID
    make: str | None
    model: str | None
    year: str | None
    license_plate: str | None
    vin: str | None
    color: str | None
    extra_data: dict | None

    model_config = {"from_attributes": True}
