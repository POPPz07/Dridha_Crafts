"""
Dridha Crafts - Review Schemas
Pydantic models for product reviews.
"""

import html
import re
import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ReviewCreate(BaseModel):
    """Schema for submitting a product review."""

    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: str = Field(..., min_length=10, max_length=1000, description="Review comment (10-1000 chars)")

    @field_validator("comment")
    @classmethod
    def sanitize_comment(cls, v: str) -> str:
        """Strip HTML tags and escape HTML entities to prevent Stored XSS."""
        cleaned = re.sub(r"<[^>]*>", "", v)
        escaped = html.escape(cleaned).strip()
        if len(escaped) < 10:
            raise ValueError("Comment must contain at least 10 non-HTML characters.")
        return escaped


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
