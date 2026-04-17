import uuid
from datetime import datetime, timezone
import enum

from sqlalchemy import String, ForeignKey, DateTime, Text, Integer, Enum as SAEnum, Boolean, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class RentalCarStatus(str, enum.Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"

class RentalCarTransmission(str, enum.Enum):
    MANUAL = "manuell"
    AUTOMATIC = "automatik"

class RentalCar(Base):
    """Tenant-owned fleet vehicles (Mietwagen)."""
    __tablename__ = "rental_cars"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)

    name: Mapped[str] = mapped_column(String(255))
    make: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_plate: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    vehicle_class: Mapped[str | None] = mapped_column(String(50), nullable=True)
    doors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    transmission: Mapped[RentalCarTransmission | None] = mapped_column(SAEnum(RentalCarTransmission), nullable=True)
    
    status: Mapped[RentalCarStatus] = mapped_column(SAEnum(RentalCarStatus), default=RentalCarStatus.AVAILABLE)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    appointments = relationship("Appointment", back_populates="rental_car")

