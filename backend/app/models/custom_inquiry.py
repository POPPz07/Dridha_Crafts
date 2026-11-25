"""
Custom Inquiry model for bespoke and tailored Kashmiri pine products.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class CustomInquiry(Base):
    """Stores customer customization inquiries, WhatsApp chat initiates, and admin approvals."""

    __tablename__ = "custom_inquiries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    customer_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    custom_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    requested_dimensions: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_dimensions: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    artisan_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending_chat", nullable=False, index=True)
    whatsapp_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship to user
    user = relationship("User", backref="custom_inquiries")

    def __repr__(self) -> str:
        return f"<CustomInquiry {self.id} {self.product_slug} status={self.status}>"
