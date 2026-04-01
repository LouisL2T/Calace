import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Float

from app.db.base import Base


class AIConversation(Base):
    """Tracks AI onboarding and prompt conversations per tenant."""
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    conversation_type: Mapped[str] = mapped_column(String(50))  # "onboarding", "module_request", "assistant"
    status: Mapped[str] = mapped_column(String(50), default="active")
    context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_conversations.id"))
    role: Mapped[str] = mapped_column(String(20))  # "user", "assistant", "system"
    content: Mapped[str] = mapped_column(Text)
    tool_calls: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation = relationship("AIConversation", back_populates="messages")


class EmbeddingStore(Base):
    """Vector store for AI context search across tenant data."""
    __tablename__ = "embedding_store"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    source_type: Mapped[str] = mapped_column(String(100))  # "customer", "appointment", "note"
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list | None] = mapped_column(ARRAY(Float), nullable=True)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
