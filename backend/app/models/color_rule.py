import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ColorRule(Base):
    """Konfigurierbare Farbregeln pro Tenant (nach Mitarbeiter, Auftragsart, Kunde)."""
    __tablename__ = "color_rules"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)

    label: Mapped[str] = mapped_column(String(255))         # z.B. "Max Mustermann" / "Hagelschaden"
    color: Mapped[str] = mapped_column(String(7))           # Hex-Code z.B. "#3B82F6"
    rule_type: Mapped[str] = mapped_column(String(50))      # "employee" | "order_type" | "customer"
    reference_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    # Für rule_type="employee" → User.id
    # Für rule_type="customer" → Customer.id
    # Für rule_type="order_type" → None (label wird als Schlüssel verwendet)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
