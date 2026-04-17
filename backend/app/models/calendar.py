import uuid
from datetime import datetime, timezone
import enum

from sqlalchemy import String, Boolean, ForeignKey, DateTime, Integer, Text, Enum as SAEnum, JSON as SAJSON
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AppointmentStatus(str, enum.Enum):
    """Backward-compatible status values + new workflow statuses."""
    # New primary statuses (user-facing)
    OPEN = "open"                  # offen
    IN_PROGRESS = "in_progress"    # in Bearbeitung
    COMPLETED = "completed"        # abgeschlossen
    POSTPONED = "postponed"        # verschoben
    # Legacy statuses kept for compatibility
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class AppointmentPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AppointmentAssignee(Base):
    """Many-to-many: one appointment can have multiple responsible users."""
    __tablename__ = "appointment_assignees"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("appointments.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    appointment = relationship("Appointment", back_populates="assignees")
    user = relationship("User")


class Appointment(Base):
    """Core calendar event / order – supports drag-and-drop, multi-day spans, and Kfz data."""
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    # Legacy single-assignee (kept for backward compat, new code uses M2M)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    project_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("projects.id"), nullable=True)

    # Kfz-Sachverständigen extensions
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("vehicles.id"), nullable=True)
    location_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("locations.id"), nullable=True)
    contact_person_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contact_persons.id"), nullable=True)
    rental_car_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("rental_cars.id"), nullable=True)
    rental_car_needed: Mapped[bool] = mapped_column(Boolean, default=False)

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[AppointmentStatus] = mapped_column(SAEnum(AppointmentStatus), default=AppointmentStatus.OPEN)
    priority: Mapped[AppointmentPriority] = mapped_column(
        SAEnum(AppointmentPriority), default=AppointmentPriority.MEDIUM
    )

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_multi_day: Mapped[bool] = mapped_column(Boolean, default=False)
    order_number: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    # Free-text location (e.g. "Parkplatz Halle 3") distinct from structured Location relation
    location_text: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Scanner-Operator workflow
    needs_scan: Mapped[bool] = mapped_column(Boolean, default=False)
    scan_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    scan_job_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Flexible extra data per industry (e.g. vehicle info, damage photos)
    meta_data: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="appointments")
    recurrence = relationship("AppointmentRecurrence", back_populates="appointment", uselist=False)
    vehicle = relationship("Vehicle")
    location = relationship("Location", back_populates="appointments")
    contact_person = relationship("ContactPerson", back_populates="appointments")
    assignees = relationship("AppointmentAssignee", back_populates="appointment", cascade="all, delete-orphan")
    rental_car = relationship("RentalCar", back_populates="appointments")


class AppointmentRecurrence(Base):
    __tablename__ = "appointment_recurrences"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("appointments.id"))
    rrule: Mapped[str] = mapped_column(String(500))  # iCal RRULE format
    max_occurrences: Mapped[int | None] = mapped_column(Integer, nullable=True)

    appointment = relationship("Appointment", back_populates="recurrence")
