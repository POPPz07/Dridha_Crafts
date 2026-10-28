"""
Dridha Crafts - Reviews Router
Endpoints for viewing and submitting product reviews.
"""

import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.product import Product
from app.models.review import Review
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewListResponse, ReviewResponse

router = APIRouter(tags=["Reviews"])


async def _get_product_by_slug(slug: str, db: AsyncSession) -> Product:
    """Helper to fetch active product by slug or raise 404."""
    result = await db.execute(
        select(Product).where(Product.slug == slug, Product.is_active == True)  # noqa: E712
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.get("/products/{slug}/reviews", response_model=ReviewListResponse)
async def get_product_reviews(
    slug: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get reviews for a product with pagination and rating distribution.

    Returns individual reviews, average rating, total count, and per-star counts.
    """
    product = await _get_product_by_slug(slug, db)

    # Fetch reviews with user info
    query = (
        select(Review)
        .where(Review.product_id == product.id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(query)
    reviews = result.scalars().all()

    # Build response items with user names
    items = []
    for review in reviews:
        # Fetch user name
        user = await db.get(User, review.user_id)
        items.append(
            ReviewResponse(
                id=review.id,
                product_id=review.product_id,
                user_id=review.user_id,
                user_name=user.full_name if user else "Anonymous",
                rating=review.rating,
                comment=review.comment,
                is_verified=review.is_verified,
                created_at=review.created_at,
            )
        )

    # Aggregation: average + total
    stats_result = await db.execute(
        select(
            func.coalesce(func.avg(Review.rating), 0).label("avg_rating"),
            func.count(Review.id).label("total"),
        ).where(Review.product_id == product.id)
    )
    stats = stats_result.one()

    # Rating distribution
    dist_result = await db.execute(
        select(
            Review.rating,
            func.count(Review.id).label("count"),
        )
        .where(Review.product_id == product.id)
        .group_by(Review.rating)
    )
    distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    for row in dist_result.all():
        distribution[str(row.rating)] = row.count

    return ReviewListResponse(
        items=items,
        average_rating=round(float(stats.avg_rating), 1),
        total_reviews=stats.total,
        rating_distribution=distribution,
    )


@router.post("/products/{slug}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    slug: str,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a review for a product.

    Constraints:
    - Auth required.
    - One review per user per product.
    - Review is auto-marked as verified if the user has a delivered order containing the product.
    """
    product = await _get_product_by_slug(slug, db)

    # Check for existing review
    existing = await db.execute(
        select(Review).where(
            Review.product_id == product.id,
            Review.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product",
        )

    # Check if user has purchased and received this product (verified review)
    purchase_check = await db.execute(
        select(OrderItem.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == current_user.id,
            Order.status == "delivered",
            OrderItem.product_id == product.id,
        )
        .limit(1)
    )
    is_verified = purchase_check.scalar_one_or_none() is not None

    review = Review(
        product_id=product.id,
        user_id=current_user.id,
        rating=data.rating,
        comment=data.comment,
        is_verified=is_verified,
    )
    db.add(review)
    await db.flush()

    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_name=current_user.full_name,
        rating=review.rating,
        comment=review.comment,
        is_verified=review.is_verified,
        created_at=review.created_at,
    )


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: _uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete the current user's own review."""
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.user_id == current_user.id,
        )
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    await db.delete(review)
    await db.flush()
    return None
