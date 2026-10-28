"""
Dridha Crafts - Product Schemas
Pydantic models for product listing, detail, bundles, and pagination.
"""

import uuid
import math
from datetime import datetime
from decimal import Decimal
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, computed_field


T = TypeVar("T")


# ── Image & Variant Schemas ──────────────────────────────────────────────────


class ProductImageResponse(BaseModel):
    """Product image response."""

    id: uuid.UUID
    image_url: str
    alt_text: str
    sort_order: int
    is_primary: bool

    model_config = {"from_attributes": True}


class ProductVariantResponse(BaseModel):
    """Product variant response."""

    id: uuid.UUID
    variant_name: str
    variant_type: str
    price_override: Optional[Decimal] = None
    stock_quantity: int

    model_config = {"from_attributes": True}


# ── Product Schemas ──────────────────────────────────────────────────────────


class ProductListResponse(BaseModel):
    """Lightweight product representation for listing pages."""

    id: uuid.UUID
    name: str
    slug: str
    short_description: str
    category: str
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    wood_type: str
    finish: str
    is_featured: bool
    stock_quantity: int
    primary_image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    """Full product detail response with images, variants, and review summary."""

    id: uuid.UUID
    name: str
    slug: str
    short_description: str
    long_description: Optional[str] = None
    category: str
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    wood_type: str
    finish: str
    weight_kg: Optional[Decimal] = None
    dimensions: Optional[str] = None
    care_instructions: Optional[str] = None
    is_active: bool
    is_featured: bool
    stock_quantity: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
    images: list[ProductImageResponse] = []
    variants: list[ProductVariantResponse] = []
    average_rating: float = 0.0
    review_count: int = 0

    model_config = {"from_attributes": True}


# ── Bundle Schemas ───────────────────────────────────────────────────────────


class BundleItemResponse(BaseModel):
    """A single item within a bundle, with product details."""

    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    product_name: Optional[str] = None
    product_slug: Optional[str] = None
    product_price: Optional[Decimal] = None
    product_image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class BundleResponse(BaseModel):
    """Full bundle detail response."""

    id: uuid.UUID
    name: str
    slug: str
    description: str
    price: Decimal
    original_price: Decimal
    is_active: bool
    is_featured: bool
    image_url: Optional[str] = None
    created_at: datetime
    items: list[BundleItemResponse] = []

    model_config = {"from_attributes": True}


class BundleListResponse(BaseModel):
    """Lightweight bundle listing."""

    id: uuid.UUID
    name: str
    slug: str
    description: str
    price: Decimal
    original_price: Decimal
    image_url: Optional[str] = None

    @computed_field
    @property
    def savings(self) -> Decimal:
        """Amount saved compared to original price."""
        return self.original_price - self.price

    model_config = {"from_attributes": True}


# ── Pagination ───────────────────────────────────────────────────────────────


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""

    items: list[T]
    total: int
    page: int
    per_page: int

    @computed_field
    @property
    def total_pages(self) -> int:
        """Total number of pages."""
        return math.ceil(self.total / self.per_page) if self.per_page > 0 else 0
