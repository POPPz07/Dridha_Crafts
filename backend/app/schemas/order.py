"""
Dridha Crafts - Order Schemas
Pydantic models for order creation, responses, and admin updates.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field
from app.schemas.user import AddressCreate


# ── Order Item Schemas ───────────────────────────────────────────────────────


class OrderItemResponse(BaseModel):
    """Full order item response — snapshot of product at purchase time."""

    id: uuid.UUID
    order_id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    variant_id: Optional[uuid.UUID] = None
    product_name: str
    product_slug: str
    variant_name: Optional[str] = None
    price: Decimal
    quantity: int
    total: Decimal
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Order Schemas ────────────────────────────────────────────────────────────


class OrderItemCreate(BaseModel):
    """Item snapshot input for order creation."""

    product_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    quantity: int = Field(default=1, ge=1, le=10)


class OrderCreate(BaseModel):
    """Schema for creating a new order from the user's cart."""

    address_id: Optional[uuid.UUID] = Field(None, description="Shipping address ID")
    shipping_address: Optional[AddressCreate] = Field(None, description="Inline shipping address")
    payment_method: str = Field(
        ..., pattern=r"^(cod|google_pay|upi|online|cashfree)$", description="Payment method: 'cod', 'google_pay', 'upi', 'online', 'cashfree'"
    )
    notes: Optional[str] = Field(None, max_length=500, description="Optional order notes")
    items: Optional[list[OrderItemCreate]] = Field(None, description="Optional cart items from client")
    idempotency_key: Optional[str] = Field(None, max_length=100, description="Unique client key to prevent duplicate checkout requests")
    customer_email: Optional[str] = Field(None, max_length=255, description="Buyer email snapshot")
    customer_phone: Optional[str] = Field(None, max_length=20, description="Buyer contact phone snapshot")


class OrderResponse(BaseModel):
    """Full order detail response."""

    id: uuid.UUID
    order_number: str
    user_id: Optional[uuid.UUID] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    shipping_name: str
    shipping_phone: str
    shipping_address_line_1: str
    shipping_address_line_2: Optional[str] = None
    shipping_city: str
    shipping_state: str
    shipping_pincode: str
    subtotal: Decimal
    shipping_cost: Decimal
    discount: Decimal
    total: Decimal
    status: str
    payment_method: str
    payment_status: str
    idempotency_key: Optional[str] = None
    expires_at: Optional[datetime] = None
    payment_completed_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    notes: Optional[str] = None
    tracking_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    """Lightweight order listing — no item details."""

    id: uuid.UUID
    order_number: str
    status: str
    total: Decimal
    payment_method: str
    payment_status: str
    item_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    """Admin-only schema for updating order status."""

    status: str = Field(
        ...,
        pattern=r"^(pending|payment_pending|payment_verification|confirmed|processing|shipped|delivered|cancelled|refunded)$",
        description="New order status",
    )
    tracking_number: Optional[str] = Field(None, max_length=100)
    cancel_reason: Optional[str] = Field(None, max_length=500)
    restore_stock: Optional[bool] = Field(
        default=False,
        description="Explicit flag for physical inventory restoration (independent of financial refund)"
    )


class PaymentConfirmation(BaseModel):
    """User confirms QR/UPI payment with optional transaction ID or UTR number."""

    transaction_id: Optional[str] = Field(None, max_length=100)
    utr_number: Optional[str] = Field(None, max_length=100)
