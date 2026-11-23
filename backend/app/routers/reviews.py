"""
Dridha Crafts - Reviews Router
Endpoints for viewing, verifying eligibility, and submitting product reviews with photo/video media.
"""

import os
import uuid as _uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.models.product import Product
from app.models.review import Review
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewListResponse,
    ReviewResponse,
    ReviewEligibilityResponse,
)

router = APIRouter(tags=["Reviews"])

# Combo bundle cross-item mapping: connects bundles to individual product slugs
COMBO_BUNDLE_MAP: dict[str, list[str]] = {
    "shiftdesk-headphone-stand": ["shiftdesk-stand", "signature-shiftdesk-stand", "headphone-stand"],
    "caddy-headphone-stand": ["custom-artisan-desk-caddy", "headphone-stand"],
    "caddy-shiftdesk-stand": ["custom-artisan-desk-caddy", "shiftdesk-stand", "signature-shiftdesk-stand"],
    "caddy-mobile-stand": ["custom-artisan-desk-caddy", "mobile-stand"],
    "trio-signature-workspace-suite": ["custom-artisan-desk-caddy", "shiftdesk-stand", "signature-shiftdesk-stand", "mobile-stand"],
    "trio-audiophile-executive-set": ["custom-artisan-desk-caddy", "shiftdesk-stand", "signature-shiftdesk-stand", "headphone-stand"],
}


def _get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage service not configured",
        )
    return create_client(url, service_key)


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


def _build_matching_slugs(slug: str) -> list[str]:
    """
    Returns all product slugs that count as verified for this product/bundle.
    If reviewing an individual product, includes any bundle that contains it.
    If reviewing a bundle, includes the bundle itself and its contained products.
    """
    matching = {slug}
    if slug in ["shiftdesk-stand", "signature-shiftdesk-stand"]:
        matching.add("shiftdesk-stand")
        matching.add("signature-shiftdesk-stand")

    # If this is a combo, add its constituent items
    if slug in COMBO_BUNDLE_MAP:
        matching.update(COMBO_BUNDLE_MAP[slug])

    # If this is an individual product, add any bundle that contains it
    for bundle_slug, items in COMBO_BUNDLE_MAP.items():
        if slug in items:
            matching.add(bundle_slug)

    return list(matching)


# ─── 1. Review Listing ────────────────────────────────────────────────────────

@router.get("/products/{slug}/reviews", response_model=ReviewListResponse)
async def get_product_reviews(
    slug: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get reviews for a product with pagination, rating distribution, and media.
    """
    product = await _get_product_by_slug(slug, db)

    query = (
        select(Review)
        .where(Review.product_id == product.id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(query)
    reviews = result.scalars().all()

    # Bulk user lookup
    user_ids = list({review.user_id for review in reviews if review.user_id})
    user_names: dict = {}
    if user_ids:
        users_result = await db.execute(
            select(User.id, User.full_name).where(User.id.in_(user_ids))
        )
        user_names = {row.id: (row.full_name or "Verified Customer") for row in users_result.all()}

    items = []
    for review in reviews:
        items.append(
            ReviewResponse(
                id=review.id,
                product_id=review.product_id,
                user_id=review.user_id,
                user_name=user_names.get(review.user_id, "Verified Customer"),
                rating=review.rating,
                title=review.title,
                comment=review.comment,
                images=review.images or [],
                video_url=review.video_url,
                is_verified=review.is_verified,
                created_at=review.created_at,
            )
        )

    # Average + total
    stats_result = await db.execute(
        select(
            func.coalesce(func.avg(Review.rating), 0).label("avg_rating"),
            func.count(Review.id).label("total"),
        ).where(Review.product_id == product.id)
    )
    stats = stats_result.one()

    # 1-5 star distribution
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


# ─── 2. Review Eligibility Check ─────────────────────────────────────────────

@router.get("/products/{slug}/review-eligibility", response_model=ReviewEligibilityResponse)
async def check_review_eligibility(
    slug: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if the current user is eligible to write a review.
    Returns can_review: true only if:
      1. User is authenticated.
      2. User has NOT already reviewed this product.
      3. User has an order with status 'delivered' containing this product (or bundle).
    """
    product = await _get_product_by_slug(slug, db)

    if not current_user:
        return ReviewEligibilityResponse(
            can_review=False,
            reason="not_authenticated",
            product_name=product.name,
        )

    # Check for existing review
    existing_q = await db.execute(
        select(Review).where(
            Review.product_id == product.id,
            Review.user_id == current_user.id,
        )
    )
    existing_rev = existing_q.scalar_one_or_none()
    if existing_rev:
        return ReviewEligibilityResponse(
            can_review=False,
            reason="already_reviewed",
            product_name=product.name,
            existing_review=ReviewResponse(
                id=existing_rev.id,
                product_id=existing_rev.product_id,
                user_id=existing_rev.user_id,
                user_name=current_user.full_name or "You",
                rating=existing_rev.rating,
                title=existing_rev.title,
                comment=existing_rev.comment,
                images=existing_rev.images or [],
                video_url=existing_rev.video_url,
                is_verified=existing_rev.is_verified,
                created_at=existing_rev.created_at,
            ),
        )

    # Check matching delivered orders
    matching_slugs = _build_matching_slugs(slug)
    order_query = (
        select(Order.id, Order.status)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == current_user.id,
            or_(
                OrderItem.product_id == product.id,
                OrderItem.product_slug.in_(matching_slugs),
            ),
        )
        .order_by(Order.created_at.desc())
    )
    order_res = await db.execute(order_query)
    orders = order_res.all()

    if not orders:
        return ReviewEligibilityResponse(
            can_review=False,
            reason="not_purchased",
            product_name=product.name,
        )

    delivered_order = next((o for o in orders if o.status == "delivered"), None)
    if delivered_order:
        return ReviewEligibilityResponse(
            can_review=True,
            reason="eligible",
            product_name=product.name,
            order_id=delivered_order.id,
        )

    # Purchased, but not yet marked as delivered (e.g. pending, confirmed, shipped)
    return ReviewEligibilityResponse(
        can_review=False,
        reason="not_delivered",
        product_name=product.name,
        order_id=orders[0].id,
    )


# ─── 3. Submit Review (Strictly Verified Only) ────────────────────────────────

@router.post("/products/{slug}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    slug: str,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a review for a product.
    Enforces strict verified purchase: User must have received the product (status: delivered).
    """
    product = await _get_product_by_slug(slug, db)

    # 1. Check duplicate review
    existing = await db.execute(
        select(Review).where(
            Review.product_id == product.id,
            Review.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted a review for this product.",
        )

    # 2. Strict purchase verification
    matching_slugs = _build_matching_slugs(slug)
    purchase_check = await db.execute(
        select(OrderItem.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == current_user.id,
            Order.status == "delivered",
            or_(
                OrderItem.product_id == product.id,
                OrderItem.product_slug.in_(matching_slugs),
            ),
        )
        .limit(1)
    )
    is_delivered_purchase = purchase_check.scalar_one_or_none() is not None

    if not is_delivered_purchase:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified buyers who have received this product can submit a review.",
        )

    review = Review(
        product_id=product.id,
        user_id=current_user.id,
        rating=data.rating,
        title=data.title,
        comment=data.comment,
        images=data.images[:4],  # Enforce max 4 images
        video_url=data.video_url,
        is_verified=True,
    )
    db.add(review)
    await db.flush()

    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_name=current_user.full_name or "Verified Customer",
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        images=review.images or [],
        video_url=review.video_url,
        is_verified=review.is_verified,
        created_at=review.created_at,
    )


# ─── 4. Media Upload (Photos & Video) ────────────────────────────────────────

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024       # 5 MB
MAX_VIDEO_SIZE_BYTES = 15 * 1024 * 1024      # 15 MB


@router.post("/reviews/upload")
async def upload_review_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a customer review photo (max 5 MB) or short video (max 15 MB) to Supabase Storage.
    Returns the public CDN URL.
    """
    content_type = (file.content_type or "").lower()
    is_image = content_type in ALLOWED_IMAGE_TYPES
    is_video = content_type in ALLOWED_VIDEO_TYPES

    if not is_image and not is_video:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Allowed: JPG, PNG, WEBP for photos; MP4, WEBM, MOV for video.",
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)

    if is_image and file_size > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo exceeds maximum allowed size of 5 MB.",
        )

    if is_video and file_size > MAX_VIDEO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video exceeds maximum allowed size of 15 MB.",
        )

    ext = ALLOWED_IMAGE_TYPES.get(content_type) or ALLOWED_VIDEO_TYPES.get(content_type) or ".bin"
    file_id = f"{_uuid.uuid4().hex[:12]}{ext}"
    storage_path = f"reviews/{current_user.id}/{file_id}"

    sb = _get_supabase_client()
    try:
        sb.storage.from_("review-media").upload(
            storage_path,
            file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        raw_url = sb.storage.from_("review-media").get_public_url(storage_path)
        public_url = raw_url.rstrip("?")
        return {
            "url": public_url,
            "type": "image" if is_image else "video",
            "filename": file.filename,
            "size": file_size,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload media to storage: {str(e)}",
        )


# ─── 5. Delete Own Review ───────────────────────────────────────────────────

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
