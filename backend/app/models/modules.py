import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text, Integer
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ModuleDefinition(Base):
    """Registry of all available modules – both built-in and AI-generated."""
    __tablename__ = "module_definitions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    category: Mapped[str] = mapped_column(String(100), default="general")

    # Which industries auto-enable this module
    auto_enable_for: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Frontend component path for dynamic loading
    component_path: Mapped[str] = mapped_column(String(500))

    # Module configuration schema (JSON Schema)
    config_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_builtin: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    tenant_modules = relationship("TenantModule", back_populates="module_def")


class TenantModule(Base):
    """Which modules a specific tenant has activated."""
    __tablename__ = "tenant_modules"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"))
    module_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("module_definitions.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    activated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="modules")
    module_def = relationship("ModuleDefinition", back_populates="tenant_modules")


class DynamicField(Base):
    """Per-tenant custom fields that extend any entity."""
    __tablename__ = "dynamic_fields"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    entity_type: Mapped[str] = mapped_column(String(100))  # "customer", "appointment", "project"
    field_name: Mapped[str] = mapped_column(String(100))
    field_type: Mapped[str] = mapped_column(String(50))  # "text", "number", "date", "select", "photo"
    field_options: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

