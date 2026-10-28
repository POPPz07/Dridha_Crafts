"""
Dridha Crafts - Cart Schemas
Pydantic models for shopping cart operations.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    """Schema for adding an item to the cart."""

    product_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    quantity: int = Field(default=1, ge=1, le=10, description="Quantity (1-10)")


class CartItemUpdate(BaseModel):
    """Schema for updating cart item quantity."""

    quantity: int = Field(..., ge=1, le=10, description="New quantity (1-10)")


class CartItemResponse(BaseModel):
    """Cart item response with product details."""

    id: uuid.UUID
    product_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    quantity: int
    product_name: str = ""
    product_slug: str = ""
    product_price: Decimal = Decimal("0.00")
    variant_name: Optional[str] = None
    price_override: Optional[Decimal] = None
    image_url: Optional[str] = None
    stock_quantity: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    """Full cart response with items and totals."""

    items: list[CartItemResponse]
    item_count: int = 0
    subtotal: Decimal = Decimal("0.00")
