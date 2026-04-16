import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Integer, ForeignKey, DateTime, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Checklist(Base):
    """Digitale Abhak-Liste ('Kleine Annahme') für einen Auftrag."""
    __tablename__ = "checklists"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    appointment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, index=True
    )
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending / in_progress / completed

    # Pflichtfelder
    mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)         # Kilometerstand
    fault_codes: Mapped[str | None] = mapped_column(Text, nullable=True)        # Fehlercodes (Freitext)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    appointment = relationship("Appointment")
    photos = relationship("ChecklistPhoto", back_populates="checklist", cascade="all, delete-orphan")
    assignee = relationship("User")


class ChecklistPhoto(Base):
    """Pflichtfotos zur 'Kleinen Annahme': Frontansichten, Schäden, Felgen, Cockpit."""
    __tablename__ = "checklist_photos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    checklist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("checklists.id", ondelete="CASCADE"), index=True
    )

    # Typ des Fotos – definiert, welches Pflichtfoto das ist
    photo_type: Mapped[str] = mapped_column(String(100))
    # Mögliche Werte:
    # "front_left"   – Frontansicht 45° links
    # "front_right"  – Frontansicht 45° rechts
    # "damage_1..n"  – Vorschadenbilder (dynamisch)
    # "rim_1..4"     – Felgenbilder (optional Nummer)
    # "cockpit"      – Cockpit / Instrumententafel

    file_url: Mapped[str] = mapped_column(String(1000))         # Supabase Storage URL oder Base64-Ref
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    checklist = relationship("Checklist", back_populates="photos")
