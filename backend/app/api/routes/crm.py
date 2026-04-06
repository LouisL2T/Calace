import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_tenant_id
from app.db.session import get_db
from app.models.crm import Customer, Vehicle, Location, ContactPerson
from app.schemas.crm import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    VehicleCreate, VehicleUpdate, VehicleResponse,
    LocationCreate, LocationUpdate, LocationResponse,
    ContactPersonCreate, ContactPersonUpdate, ContactPersonResponse,
)

router = APIRouter(prefix="/crm", tags=["crm"])


# --- Customers ---

@router.get("/customers", response_model=list[CustomerResponse])
async def list_customers(
    search: str | None = Query(None),
    customer_type: str | None = Query(None),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Customer).where(Customer.tenant_id == tenant_id)
    if search:
        query = query.where(
            or_(
                Customer.first_name.ilike(f"%{search}%"),
                Customer.last_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.company.ilike(f"%{search}%"),
                Customer.company_name.ilike(f"%{search}%"),
            )
        )
    if customer_type:
        query = query.where(Customer.customer_type == customer_type)
    query = query.order_by(Customer.last_name)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/customers", response_model=CustomerResponse)
async def create_customer(
    data: CustomerCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    customer = Customer(tenant_id=tenant_id, **data.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404)
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404)
    await db.delete(customer)
    await db.commit()
    return {"ok": True}


# --- Locations ---

@router.get("/customers/{customer_id}/locations", response_model=list[LocationResponse])
async def list_locations(
    customer_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Location)
        .where(Location.customer_id == customer_id, Location.tenant_id == tenant_id)
        .options(selectinload(Location.contact_persons))
        .order_by(Location.name)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/locations", response_model=LocationResponse)
async def create_location(
    data: LocationCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    location = Location(tenant_id=tenant_id, **data.model_dump())
    db.add(location)
    await db.commit()
    await db.refresh(location)
    # Eagerly load contact_persons for response
    result = await db.execute(
        select(Location)
        .where(Location.id == location.id)
        .options(selectinload(Location.contact_persons))
    )
    return result.scalar_one()


@router.put("/locations/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: uuid.UUID,
    data: LocationUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Location).where(Location.id == location_id, Location.tenant_id == tenant_id)
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(location, field, value)
    await db.commit()
    await db.refresh(location)
    # Re-fetch with contacts
    result = await db.execute(
        select(Location)
        .where(Location.id == location.id)
        .options(selectinload(Location.contact_persons))
    )
    return result.scalar_one()


@router.delete("/locations/{location_id}")
async def delete_location(
    location_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Location).where(Location.id == location_id, Location.tenant_id == tenant_id)
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404)
    await db.delete(location)
    await db.commit()
    return {"ok": True}


# --- Contact Persons ---

@router.get("/locations/{location_id}/contacts", response_model=list[ContactPersonResponse])
async def list_contacts(
    location_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(ContactPerson)
        .where(ContactPerson.location_id == location_id, ContactPerson.tenant_id == tenant_id)
        .order_by(ContactPerson.last_name)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/contacts", response_model=ContactPersonResponse)
async def create_contact(
    data: ContactPersonCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    contact = ContactPerson(tenant_id=tenant_id, **data.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.put("/contacts/{contact_id}", response_model=ContactPersonResponse)
async def update_contact(
    contact_id: uuid.UUID,
    data: ContactPersonUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ContactPerson).where(ContactPerson.id == contact_id, ContactPerson.tenant_id == tenant_id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ContactPerson).where(ContactPerson.id == contact_id, ContactPerson.tenant_id == tenant_id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404)
    await db.delete(contact)
    await db.commit()
    return {"ok": True}


# --- Vehicles ---

@router.get("/vehicles", response_model=list[VehicleResponse])
async def list_vehicles(
    customer_id: uuid.UUID | None = Query(None),
    search: str | None = Query(None),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Vehicle).where(Vehicle.tenant_id == tenant_id)
    if customer_id:
        query = query.where(Vehicle.customer_id == customer_id)
    if search:
        query = query.where(
            or_(
                Vehicle.make.ilike(f"%{search}%"),
                Vehicle.model.ilike(f"%{search}%"),
                Vehicle.license_plate.ilike(f"%{search}%"),
                Vehicle.vin.ilike(f"%{search}%"),
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/vehicles", response_model=VehicleResponse)
async def create_vehicle(
    data: VehicleCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    vehicle = Vehicle(tenant_id=tenant_id, **data.model_dump())
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: uuid.UUID,
    data: VehicleUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.tenant_id == tenant_id)
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.tenant_id == tenant_id)
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404)
    await db.delete(vehicle)
    await db.commit()
    return {"ok": True}
