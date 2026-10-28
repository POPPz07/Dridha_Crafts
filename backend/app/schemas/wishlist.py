"""
Dridha Crafts - Wishlist Schemas
Pydantic models for wishlist operations.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class WishlistItemResponse(BaseModel):
    """Wishlist item with product details."""

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str = ""
    product_slug: str = ""
    product_price: Decimal = Decimal("0.00")
    product_image_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class WishlistResponse(BaseModel):
    """Full wishlist response."""

    items: list[WishlistItemResponse]
    total: int = 0
