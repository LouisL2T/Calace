import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_tenant_id
from app.db.session import get_db
from app.models.user import User
from app.models.business import TimeEntry, Invoice, InvoiceItem, MaterialItem
from app.schemas.business import (
    TimeEntryCreate, TimeEntryStop, TimeEntryResponse,
    InvoiceCreate, InvoiceResponse,
    MaterialCreate, MaterialResponse,
)

router = APIRouter(prefix="/business", tags=["business"])


# --- Time Tracking ---

@router.post("/time/start", response_model=TimeEntryResponse)
async def start_timer(
    data: TimeEntryCreate,
    user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    entry = TimeEntry(
        tenant_id=tenant_id,
        user_id=user.id,
        project_id=data.project_id,
        appointment_id=data.appointment_id,
        description=data.description,
        start_time=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.post("/time/{entry_id}/stop", response_model=TimeEntryResponse)
async def stop_timer(
    entry_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TimeEntry).where(TimeEntry.id == entry_id, TimeEntry.tenant_id == tenant_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404)

    entry.end_time = datetime.now(timezone.utc)
    entry.duration_seconds = int((entry.end_time - entry.start_time).total_seconds())
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/time", response_model=list[TimeEntryResponse])
async def list_time_entries(
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TimeEntry)
        .where(TimeEntry.tenant_id == tenant_id)
        .order_by(TimeEntry.start_time.desc())
        .limit(100)
    )
    return result.scalars().all()


# --- Invoicing ---

@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(
    data: InvoiceCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    # Generate invoice number
    count_result = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.tenant_id == tenant_id)
    )
    count = count_result.scalar() or 0
    invoice_number = f"INV-{datetime.now(timezone.utc).strftime('%Y%m')}-{count + 1:04d}"

    subtotal = sum(item.quantity * item.unit_price for item in data.items)
    tax_amount = subtotal * data.tax_rate / 100
    total = subtotal + tax_amount

    invoice = Invoice(
        tenant_id=tenant_id,
        customer_id=data.customer_id,
        appointment_id=data.appointment_id,
        invoice_number=invoice_number,
        subtotal=subtotal,
        tax_rate=data.tax_rate,
        tax_amount=tax_amount,
        total=total,
        notes=data.notes,
    )
    db.add(invoice)
    await db.flush()

    for item_data in data.items:
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total=item_data.quantity * item_data.unit_price,
        )
        db.add(item)

    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice)
        .where(Invoice.tenant_id == tenant_id)
        .order_by(Invoice.issue_date.desc())
    )
    return result.scalars().all()


# --- Materials ---

@router.get("/materials", response_model=list[MaterialResponse])
async def list_materials(
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MaterialItem).where(MaterialItem.tenant_id == tenant_id).order_by(MaterialItem.name)
    )
    return result.scalars().all()


@router.post("/materials", response_model=MaterialResponse)
async def create_material(
    data: MaterialCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    item = MaterialItem(tenant_id=tenant_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/materials/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: uuid.UUID,
    data: MaterialCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MaterialItem).where(MaterialItem.id == material_id, MaterialItem.tenant_id == tenant_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404)
    for field, value in data.model_dump().items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item
