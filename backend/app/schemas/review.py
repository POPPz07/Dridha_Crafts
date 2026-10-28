"""
Dridha Crafts - Review Schemas
Pydantic models for product reviews.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    """Schema for submitting a product review."""

    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: str = Field(..., min_length=10, max_length=1000, description="Review comment (10-1000 chars)")


class ReviewResponse(BaseModel):
    """Single review response."""

    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str = ""
    rating: int
    comment: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewListResponse(BaseModel):
    """Review listing with aggregated stats."""

    items: list[ReviewResponse]
    average_rating: float = 0.0
    total_reviews: int = 0
    rating_distribution: dict[str, int] = Field(
        default_factory=lambda: {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    )
