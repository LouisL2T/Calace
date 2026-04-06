from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


# --- Customer ---

class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    company_name: str | None = None
    customer_type: str = "individual"
    address: str | None = None
    custom_fields: dict | None = None


class CustomerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    company_name: str | None = None
    customer_type: str | None = None
    address: str | None = None
    custom_fields: dict | None = None


class CustomerResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    customer_type: str
    company_name: str | None
    first_name: str
    last_name: str
    email: str | None
    phone: str | None
    company: str | None
    address: str | None
    custom_fields: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Location ---

class LocationCreate(BaseModel):
    customer_id: UUID
    name: str
    street: str | None = None
    zip_code: str | None = None
    city: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class LocationUpdate(BaseModel):
    name: str | None = None
    street: str | None = None
    zip_code: str | None = None
    city: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class ContactPersonBrief(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    role: str | None
    phone: str | None
    mobile: str | None
    email: str | None
    is_primary: bool

    model_config = {"from_attributes": True}


class LocationResponse(BaseModel):
    id: UUID
    customer_id: UUID
    name: str
    street: str | None
    zip_code: str | None
    city: str | None
    phone: str | None
    email: str | None
    notes: str | None
    latitude: float | None
    longitude: float | None
    contact_persons: list[ContactPersonBrief] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Contact Person ---

class ContactPersonCreate(BaseModel):
    location_id: UUID
    first_name: str
    last_name: str
    role: str | None = None
    phone: str | None = None
    mobile: str | None = None
    email: str | None = None
    notes: str | None = None
    is_primary: bool = False


class ContactPersonUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    phone: str | None = None
    mobile: str | None = None
    email: str | None = None
    notes: str | None = None
    is_primary: bool | None = None


class ContactPersonResponse(BaseModel):
    id: UUID
    location_id: UUID
    first_name: str
    last_name: str
    role: str | None
    phone: str | None
    mobile: str | None
    email: str | None
    notes: str | None
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Vehicle ---

class VehicleCreate(BaseModel):
    customer_id: UUID
    make: str | None = None
    model: str | None = None
    year: str | None = None
    license_plate: str | None = None
    vin: str | None = None
    color: str | None = None
    extra_data: dict | None = None


class VehicleUpdate(BaseModel):
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
