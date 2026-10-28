"""
Dridha Crafts - Wishlist Router
Toggle-based wishlist management for authenticated users.
"""

import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.product import Product, ProductImage
from app.models.review import Wishlist
from app.models.user import User
from app.schemas.wishlist import WishlistItemResponse, WishlistResponse

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("", response_model=WishlistResponse)
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's wishlist with product details."""
    query = (
        select(Wishlist)
        .where(Wishlist.user_id == current_user.id)
        .options(selectinload(Wishlist.product).selectinload(Product.images))
        .order_by(Wishlist.created_at.desc())
    )
    result = await db.execute(query)
    wishlist_items = result.scalars().all()

    items = []
    for wi in wishlist_items:
        product = wi.product
        primary_image = None
        if product and product.images:
            primary_image = next(
                (img.image_url for img in product.images if img.is_primary),
                product.images[0].image_url if product.images else None,
            )
        items.append(
            WishlistItemResponse(
                id=wi.id,
                product_id=wi.product_id,
                product_name=product.name if product else "",
                product_slug=product.slug if product else "",
                product_price=product.price if product else 0,
                product_image_url=primary_image,
                created_at=wi.created_at,
            )
        )

    return WishlistResponse(items=items, total=len(items))


@router.post("/{product_id}", status_code=status.HTTP_200_OK)
async def toggle_wishlist(
    product_id: _uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Toggle a product in the wishlist.

    If the product is already in the wishlist, it is removed.
    If it is not, it is added.

    Returns the action taken ('added' or 'removed').
    """
    # Validate product exists
    product = await db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Check if already in wishlist
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == product_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.flush()
        return {"action": "removed", "product_id": str(product_id)}
    else:
        wishlist_item = Wishlist(
            user_id=current_user.id,
            product_id=product_id,
        )
        db.add(wishlist_item)
        await db.flush()
        return {"action": "added", "product_id": str(product_id)}


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(
    product_id: _uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a product from the wishlist."""
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == product_id,
        )
    )
    existing = result.scalar_one_or_none()

    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not in wishlist",
        )

    await db.delete(existing)
    await db.flush()
    return None
