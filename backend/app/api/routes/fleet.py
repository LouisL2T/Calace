import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_tenant_id
from app.db.session import get_db
from app.models.fleet import RentalCar
from app.schemas.fleet import RentalCarCreate, RentalCarUpdate, RentalCarResponse

router = APIRouter(prefix="/fleet", tags=["fleet"])


@router.get("/rental-cars", response_model=List[RentalCarResponse])
async def list_rental_cars(
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RentalCar).where(RentalCar.tenant_id == tenant_id).order_by(RentalCar.name)
    )
    return result.scalars().all()


@router.post("/rental-cars", response_model=RentalCarResponse)
async def create_rental_car(
    data: RentalCarCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    car = RentalCar(tenant_id=tenant_id, **data.model_dump())
    db.add(car)
    await db.commit()
    await db.refresh(car)
    return car


@router.put("/rental-cars/{car_id}", response_model=RentalCarResponse)
async def update_rental_car(
    car_id: uuid.UUID,
    data: RentalCarUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RentalCar).where(RentalCar.id == car_id, RentalCar.tenant_id == tenant_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Rental car not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(car, field, value)

    await db.commit()
    await db.refresh(car)
    return car


@router.delete("/rental-cars/{car_id}")
async def delete_rental_car(
    car_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RentalCar).where(RentalCar.id == car_id, RentalCar.tenant_id == tenant_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Rental car not found")

    await db.delete(car)
    await db.commit()
    return {"ok": True}
