import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Integer, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Appointment(Base):
    """Core calendar event – supports drag-and-drop rescheduling."""
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    project_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("projects.id"), nullable=True)

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[AppointmentStatus] = mapped_column(SAEnum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)

    # Flexible extra data per industry (e.g. vehicle info, damage photos)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="appointments")
    recurrence = relationship("AppointmentRecurrence", back_populates="appointment", uselist=False)


class AppointmentRecurrence(Base):
    __tablename__ = "appointment_recurrences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("appointments.id"))
    rrule: Mapped[str] = mapped_column(String(500))  # iCal RRULE format
    max_occurrences: Mapped[int | None] = mapped_column(Integer, nullable=True)

    appointment = relationship("Appointment", back_populates="recurrence")
