"""
Dridha Crafts - Review Schemas
Pydantic models for product reviews and verified purchase eligibility.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    """Schema for submitting a product review."""

    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    title: Optional[str] = Field(None, max_length=200, description="Short summary title")
    comment: str = Field(..., min_length=5, max_length=2000, description="Review comment (5-2000 chars)")
    images: list[str] = Field(default_factory=list, max_length=4, description="Up to 4 customer photo URLs")
    video_url: Optional[str] = Field(None, max_length=500, description="Customer video URL")


class ReviewResponse(BaseModel):
    """Single review response."""

    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str = "Verified Collector"
    rating: int
    title: Optional[str] = None
    comment: str
    images: list[str] = Field(default_factory=list)
    video_url: Optional[str] = None
    is_verified: bool = True
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


class ReviewEligibilityResponse(BaseModel):
    """Check if the current user is eligible to review a product."""

    can_review: bool
    reason: str  # "eligible" | "already_reviewed" | "not_delivered" | "not_purchased" | "not_authenticated"
    product_name: str
    order_id: Optional[uuid.UUID] = None
    existing_review: Optional[ReviewResponse] = None
