from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


# Time tracking
class TimeEntryCreate(BaseModel):
    project_id: UUID | None = None
    appointment_id: UUID | None = None
    description: str | None = None


class TimeEntryStop(BaseModel):
    end_time: datetime | None = None


class TimeEntryResponse(BaseModel):
    id: UUID
    user_id: UUID
    project_id: UUID | None
    appointment_id: UUID | None
    description: str | None
    start_time: datetime
    end_time: datetime | None
    duration_seconds: int | None

    model_config = {"from_attributes": True}


# Invoicing
class InvoiceItemCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal


class InvoiceCreate(BaseModel):
    customer_id: UUID
    appointment_id: UUID | None = None
    items: list[InvoiceItemCreate]
    notes: str | None = None
    tax_rate: Decimal = Decimal("19.00")


class InvoiceResponse(BaseModel):
    id: UUID
    invoice_number: str
    customer_id: UUID
    status: str
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total: Decimal
    issue_date: datetime
    due_date: datetime | None

    model_config = {"from_attributes": True}


# Materials
class MaterialCreate(BaseModel):
    name: str
    description: str | None = None
    sku: str | None = None
    quantity_in_stock: int = 0
    min_stock_level: int = 0
    unit: str = "Stück"
    unit_price: Decimal | None = None
    category: str | None = None


class MaterialResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    sku: str | None
    quantity_in_stock: int
    min_stock_level: int
    unit: str
    unit_price: Decimal | None
    category: str | None

    model_config = {"from_attributes": True}
