import uuid
import math
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_tenant_id
from app.db.session import get_db
from app.models.calendar import Appointment, AppointmentStatus
from app.models.crm import Customer, Vehicle, Location, ContactPerson
from app.schemas.orders import OrderListItem, PaginatedOrderResponse

router = APIRouter(prefix="/orders", tags=["orders"])


def _build_order_item(row) -> dict:
    """Build an OrderListItem dict from a query row tuple."""
    apt, customer, vehicle, location, contact = row
    
    customer_name = None
    if customer:
        if customer.company_name:
            customer_name = customer.company_name
        elif customer.company:
            customer_name = customer.company
        else:
            customer_name = f"{customer.first_name} {customer.last_name}"

    vehicle_display = None
    if vehicle:
        parts = [p for p in [vehicle.make, vehicle.model] if p]
        vehicle_display = " ".join(parts) if parts else None

    contact_name = None
    if contact:
        contact_name = f"{contact.first_name} {contact.last_name}"

    return OrderListItem(
        id=apt.id,
        title=apt.title,
        order_number=apt.order_number,
        status=apt.status,
        start_time=apt.start_time,
        end_time=apt.end_time,
        is_multi_day=apt.is_multi_day,
        color=apt.color,
        description=apt.description,
        customer_id=apt.customer_id,
        customer_name=customer_name,
        location_id=apt.location_id,
        location_name=location.name if location else None,
        location_city=location.city if location else None,
        contact_person_id=apt.contact_person_id,
        contact_person_name=contact_name,
        vehicle_id=apt.vehicle_id,
        vehicle_display=vehicle_display,
        license_plate=vehicle.license_plate if vehicle else None,
        vin=vehicle.vin if vehicle else None,
        created_at=apt.created_at,
        updated_at=apt.updated_at,
    )


@router.get("/search", response_model=PaginatedOrderResponse)
async def search_orders(
    q: str | None = Query(None, description="Freitextsuche"),
    customer_id: uuid.UUID | None = Query(None),
    vehicle_make: str | None = Query(None),
    vehicle_model: str | None = Query(None),
    license_plate: str | None = Query(None),
    vin: str | None = Query(None),
    status: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    sort_by: str = Query("start_time"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Global order search with JOINs across Appointment, Customer, Vehicle, Location, ContactPerson."""

    # Base query with outer joins
    base_query = (
        select(Appointment, Customer, Vehicle, Location, ContactPerson)
        .outerjoin(Customer, Appointment.customer_id == Customer.id)
        .outerjoin(Vehicle, Appointment.vehicle_id == Vehicle.id)
        .outerjoin(Location, Appointment.location_id == Location.id)
        .outerjoin(ContactPerson, Appointment.contact_person_id == ContactPerson.id)
        .where(Appointment.tenant_id == tenant_id)
    )

    # Free-text search across multiple fields
    if q:
        search_term = f"%{q}%"
        base_query = base_query.where(
            or_(
                Appointment.title.ilike(search_term),
                Appointment.order_number.ilike(search_term),
                Appointment.description.ilike(search_term),
                Customer.company_name.ilike(search_term),
                Customer.company.ilike(search_term),
                Customer.first_name.ilike(search_term),
                Customer.last_name.ilike(search_term),
                Vehicle.make.ilike(search_term),
                Vehicle.model.ilike(search_term),
                Vehicle.license_plate.ilike(search_term),
                Vehicle.vin.ilike(search_term),
                Location.name.ilike(search_term),
                Location.city.ilike(search_term),
            )
        )

    # Specific filters
    if customer_id:
        base_query = base_query.where(Appointment.customer_id == customer_id)
    if vehicle_make:
        base_query = base_query.where(Vehicle.make.ilike(f"%{vehicle_make}%"))
    if vehicle_model:
        base_query = base_query.where(Vehicle.model.ilike(f"%{vehicle_model}%"))
    if license_plate:
        base_query = base_query.where(Vehicle.license_plate.ilike(f"%{license_plate}%"))
    if vin:
        base_query = base_query.where(Vehicle.vin.ilike(f"%{vin}%"))
    if status:
        base_query = base_query.where(Appointment.status == status)
    if date_from:
        base_query = base_query.where(Appointment.start_time >= date_from)
    if date_to:
        base_query = base_query.where(Appointment.end_time <= date_to)

    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Sorting
    sort_column_map = {
        "start_time": Appointment.start_time,
        "created_at": Appointment.created_at,
        "order_number": Appointment.order_number,
        "title": Appointment.title,
        "status": Appointment.status,
    }
    sort_col = sort_column_map.get(sort_by, Appointment.start_time)
    if sort_dir == "asc":
        base_query = base_query.order_by(sort_col.asc())
    else:
        base_query = base_query.order_by(sort_col.desc())

    # Pagination
    base_query = base_query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(base_query)
    rows = result.all()

    items = [_build_order_item(row) for row in rows]
    total_pages = max(1, math.ceil(total / page_size))

    return PaginatedOrderResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
