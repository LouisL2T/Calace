import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, ForeignKey, DateTime, Enum as SAEnum, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base


class TenantIndustry(str, enum.Enum):
    HANDWERK = "handwerk"
    LACKIERER = "lackierer"
    DELLENdruecker = "dellendruecker"
    DIENSTLEISTER = "dienstleister"
    WERKSTATT = "werkstatt"
    CUSTOM = "custom"


class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    EMPLOYEE = "employee"
    VIEWER = "viewer"
    SCANNER_OPERATOR = "scanner_operator"


class Tenant(Base):
    """Multi-tenant organization – adapts to industry via AI onboarding."""
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    industry: Mapped[TenantIndustry] = mapped_column(SAEnum(TenantIndustry), default=TenantIndustry.CUSTOM)
    industry_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    members = relationship("TenantMember", back_populates="tenant", cascade="all, delete-orphan")
    modules = relationship("TenantModule", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    memberships = relationship("TenantMember", back_populates="user")


class TenantMember(Base):
    __tablename__ = "tenant_members"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.EMPLOYEE)

    tenant = relationship("Tenant", back_populates="members")
    user = relationship("User", back_populates="memberships")

