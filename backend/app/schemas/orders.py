from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.calendar import AppointmentStatus


class OrderListItem(BaseModel):
    """Flattened order view with resolved relations for the global order list."""
    id: UUID
    title: str
    order_number: str | None
    status: AppointmentStatus
    start_time: datetime
    end_time: datetime
    is_multi_day: bool
    color: str | None
    description: str | None

    # Resolved from Customer
    customer_id: UUID | None
    customer_name: str | None

    # Resolved from Location
    location_id: UUID | None
    location_name: str | None
    location_city: str | None

    # Resolved from ContactPerson
    contact_person_id: UUID | None
    contact_person_name: str | None

    # Resolved from Vehicle
    vehicle_id: UUID | None
    vehicle_display: str | None  # "Mercedes Benz C 300"
    license_plate: str | None
    vin: str | None

    created_at: datetime
    updated_at: datetime


class OrderSearchParams(BaseModel):
    q: str | None = None
    customer_id: UUID | None = None
    vehicle_make: str | None = None
    vehicle_model: str | None = None
    license_plate: str | None = None
    vin: str | None = None
    status: AppointmentStatus | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    sort_by: str = "start_time"
    sort_dir: str = "desc"
    page: int = 1
    page_size: int = 20


class PaginatedOrderResponse(BaseModel):
    items: list[OrderListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
