from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ColorRuleCreate(BaseModel):
    label: str
    color: str                    # Hex-Code z.B. "#3B82F6"
    rule_type: str                # "employee" | "order_type" | "customer"
    reference_id: UUID | None = None


class ColorRuleUpdate(BaseModel):
    label: str | None = None
    color: str | None = None
    rule_type: str | None = None
    reference_id: UUID | None = None


class ColorRuleResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    label: str
    color: str
    rule_type: str
    reference_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
