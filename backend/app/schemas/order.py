"""
Dridha Crafts - Order Schemas
Pydantic models for order creation, responses, and admin updates.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ── Order Item Schemas ───────────────────────────────────────────────────────


class OrderItemResponse(BaseModel):
    """Full order item response — snapshot of product at purchase time."""

    id: uuid.UUID
    order_id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    product_name: str
    product_slug: str
    variant_name: Optional[str] = None
    price: Decimal
    quantity: int
    total: Decimal
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Order Schemas ────────────────────────────────────────────────────────────


class OrderCreate(BaseModel):
    """Schema for creating a new order from the user's cart."""

    address_id: uuid.UUID = Field(..., description="Shipping address ID")
    payment_method: str = Field(
        ..., pattern=r"^(cod|google_pay)$", description="Payment method: 'cod' or 'google_pay'"
    )
    notes: Optional[str] = Field(None, max_length=500, description="Optional order notes")


class OrderResponse(BaseModel):
    """Full order detail response."""

    id: uuid.UUID
    order_number: str
    user_id: Optional[uuid.UUID] = None
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


class PaymentConfirmation(BaseModel):
    """User confirms QR/UPI payment with optional transaction ID."""

    transaction_id: Optional[str] = Field(None, max_length=100)
