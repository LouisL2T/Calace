import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_tenant_id
from app.db.session import get_db
from app.models.crm import Customer, Vehicle
from app.schemas.crm import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    VehicleCreate, VehicleResponse,
)

router = APIRouter(prefix="/crm", tags=["crm"])


@router.get("/customers", response_model=list[CustomerResponse])
async def list_customers(
    search: str | None = Query(None),
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
            )
        )
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


# --- Vehicles ---

@router.get("/vehicles", response_model=list[VehicleResponse])
async def list_vehicles(
    customer_id: uuid.UUID | None = Query(None),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Vehicle).where(Vehicle.tenant_id == tenant_id)
    if customer_id:
        query = query.where(Vehicle.customer_id == customer_id)
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
