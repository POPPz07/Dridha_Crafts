"""
Payment, PaymentAttempt, and PaymentEvent models for Cashfree gateway integration.
"""

import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PaymentGateway(str, enum.Enum):
    """Supported payment gateway providers."""
    CASHFREE = "cashfree"


class PaymentEnvironment(str, enum.Enum):
    """Gateway operating environments."""
    SANDBOX = "sandbox"
    PRODUCTION = "production"


class PaymentSessionStatus(str, enum.Enum):
    """Lifecycle statuses for a Cashfree order / session (payments table)."""
    INITIATING = "initiating"
    ACTIVE = "active"
    PAID = "paid"
    EXPIRED = "expired"
    FAILED = "failed"
    TERMINATED = "terminated"
    INITIATION_FAILED = "initiation_failed"


class PaymentAttemptStatus(str, enum.Enum):
    """Normalized lifecycle statuses for a payment transaction attempt."""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    USER_DROPPED = "user_dropped"


class WebhookProcessingStatus(str, enum.Enum):
    """Status of webhook event ingestion and state reconciliation."""
    RECEIVED = "received"
    PROCESSED = "processed"
    IGNORED = "ignored"
    FAILED = "failed"


class Payment(Base):
    """One Cashfree order/session record linked to an internal order."""

    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    gateway: Mapped[str] = mapped_column(
        String(50), default=PaymentGateway.CASHFREE.value, nullable=False
    )
    environment: Mapped[str] = mapped_column(
        String(20), default=PaymentEnvironment.SANDBOX.value, nullable=False
    )
    merchant_order_id: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    cf_order_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    payment_session_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(3), default="INR", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30), default=PaymentSessionStatus.INITIATING.value, nullable=False, index=True
    )
    idempotency_key: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    order: Mapped["Order"] = relationship(back_populates="payments")  # noqa: F821
    attempts: Mapped[list["PaymentAttempt"]] = relationship(
        back_populates="payment", cascade="all, delete-orphan"
    )
    events: Mapped[list["PaymentEvent"]] = relationship(back_populates="payment")

    def __repr__(self) -> str:
        return f"<Payment {self.merchant_order_id} cf={self.cf_order_id} status={self.status}>"


class PaymentAttempt(Base):
    """Individual payment transaction attempt on Cashfree."""

    __tablename__ = "payment_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payments.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    cf_payment_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    payment_status: Mapped[str] = mapped_column(
        String(30), default=PaymentAttemptStatus.PENDING.value, nullable=False, index=True
    )
    provider_status: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    payment_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(3), default="INR", nullable=False
    )
    payment_method: Mapped[str] = mapped_column(
        String(30), nullable=False
    )
    bank_reference: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    payment_message: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    error_code: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    payment_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    payment_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    payment: Mapped["Payment"] = relationship(back_populates="attempts")
    events: Mapped[list["PaymentEvent"]] = relationship(back_populates="payment_attempt")

    def __repr__(self) -> str:
        return f"<PaymentAttempt {self.cf_payment_id} status={self.payment_status} method={self.payment_method}>"


class PaymentEvent(Base):
    """Audit log of incoming webhook events and reconciliation actions."""

    __tablename__ = "payment_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    payment_attempt_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payment_attempts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    gateway: Mapped[str] = mapped_column(
        String(50), default=PaymentGateway.CASHFREE.value, nullable=False
    )
    event_type: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    webhook_version: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    cf_event_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    payload_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )
    signature_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    processing_status: Mapped[str] = mapped_column(
        String(30), default=WebhookProcessingStatus.RECEIVED.value, nullable=False, index=True
    )
    payload: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    payment: Mapped["Payment | None"] = relationship(back_populates="events")
    payment_attempt: Mapped["PaymentAttempt | None"] = relationship(back_populates="events")

    def __repr__(self) -> str:
        return f"<PaymentEvent type={self.event_type} status={self.processing_status} hash={self.payload_hash[:8]}>"

