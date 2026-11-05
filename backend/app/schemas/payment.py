"""
Dridha Crafts - Payment Schemas
Pydantic models for Cashfree checkout, session responses, and payment status.
"""

import uuid
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.order import OrderItemCreate
from app.schemas.user import AddressCreate


class CashfreeCheckoutRequest(BaseModel):
    """Payload for initiating a Cashfree Hosted Checkout session."""

    address_id: Optional[uuid.UUID] = Field(None, description="Saved shipping address ID")
    shipping_address: Optional[AddressCreate] = Field(None, description="Inline shipping address")
    items: Optional[list[OrderItemCreate]] = Field(None, description="Cart items snapshot")
    idempotency_key: str = Field(..., min_length=1, max_length=100, description="Unique client idempotency key")
    customer_email: Optional[str] = Field(None, max_length=255, description="Customer email")
    customer_phone: Optional[str] = Field(None, max_length=20, description="Customer contact phone")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")


class CashfreeCheckoutResponse(BaseModel):
    """Response returned to customer to launch Cashfree Hosted Checkout."""

    order_id: uuid.UUID
    order_number: str
    payment_id: uuid.UUID
    merchant_order_id: str
    cf_order_id: Optional[str] = None
    payment_session_id: str
    environment: str
    amount: Decimal
    currency: str = "INR"

    model_config = {"from_attributes": True}


class PaymentStatusResponse(BaseModel):
    """Customer-facing payment and order status summary."""

    payment_id: uuid.UUID
    order_id: uuid.UUID
    order_number: str
    merchant_order_id: str
    cf_order_id: Optional[str] = None
    status: str
    amount: Decimal
    currency: str = "INR"
    order_status: str
    payment_status: str
    payment_method: Optional[str] = None
    bank_reference: Optional[str] = None

    model_config = {"from_attributes": True}

