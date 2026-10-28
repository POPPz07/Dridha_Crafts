"""
Dridha Crafts - Cart Router
Authenticated endpoints for managing the shopping cart.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.cart import CartItem
from app.models.product import Product, ProductImage, ProductVariant
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemResponse, CartItemUpdate, CartResponse

router = APIRouter(prefix="/cart", tags=["Cart"])


async def _build_cart_response(db: AsyncSession, user_id) -> CartResponse:
    """Helper to build a full cart response with product details and totals."""
    query = (
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(
            selectinload(CartItem.product).selectinload(Product.images),
            selectinload(CartItem.variant),
        )
        .order_by(CartItem.created_at.desc())
    )
    result = await db.execute(query)
    cart_items = result.scalars().all()

    items = []
    subtotal = Decimal("0.00")

    for ci in cart_items:
        product = ci.product
        variant = ci.variant

        # Determine the effective price
        unit_price = variant.price_override if variant and variant.price_override else product.price
        line_total = unit_price * ci.quantity
        subtotal += line_total

        # Primary image
        primary_image = None
        if product.images:
            primary_image = next(
                (img.image_url for img in product.images if img.is_primary),
                product.images[0].image_url if product.images else None,
            )

        items.append(
            CartItemResponse(
                id=ci.id,
                product_id=ci.product_id,
                variant_id=ci.variant_id,
                quantity=ci.quantity,
                product_name=product.name,
                product_slug=product.slug,
                product_price=product.price,
                variant_name=variant.variant_name if variant else None,
                price_override=variant.price_override if variant else None,
                image_url=primary_image,
                stock_quantity=variant.stock_quantity if variant else product.stock_quantity,
                created_at=ci.created_at,
            )
        )

    return CartResponse(
        items=items,
        item_count=len(items),
        subtotal=subtotal,
    )


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's cart with product details and totals."""
    return await _build_cart_response(db, current_user.id)


@router.post("/add", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    data: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add an item to the cart.

    If the same product+variant already exists, the quantity is incremented (upsert).
    Validates that the product exists and has sufficient stock.
    """
    # Validate product exists and is active
    product = await db.get(Product, data.product_id)
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or inactive",
        )

    # Validate variant if provided
    if data.variant_id:
        variant = await db.get(ProductVariant, data.variant_id)
        if not variant or variant.product_id != product.id or not variant.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product variant not found or inactive",
            )
        available_stock = variant.stock_quantity
    else:
        available_stock = product.stock_quantity

    # Check for existing cart item (upsert)
    query = select(CartItem).where(
        CartItem.user_id == current_user.id,
        CartItem.product_id == data.product_id,
        CartItem.variant_id == data.variant_id,
    )
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        new_qty = existing.quantity + data.quantity
        if new_qty > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {available_stock} items available in stock",
            )
        existing.quantity = new_qty
    else:
        if data.quantity > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {available_stock} items available in stock",
            )
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=data.product_id,
            variant_id=data.variant_id,
            quantity=data.quantity,
        )
        db.add(cart_item)

    await db.flush()
    return await _build_cart_response(db, current_user.id)


@router.put("/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: str,
    data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update quantity of a cart item. User can only update their own items."""
    import uuid as _uuid

    try:
        item_uuid = _uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    result = await db.execute(
        select(CartItem)
        .where(CartItem.id == item_uuid, CartItem.user_id == current_user.id)
        .options(selectinload(CartItem.product), selectinload(CartItem.variant))
    )
    cart_item = result.scalar_one_or_none()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    # Stock validation
    available = (
        cart_item.variant.stock_quantity
        if cart_item.variant and cart_item.variant.stock_quantity is not None
        else cart_item.product.stock_quantity
    )
    if data.quantity > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {available} items available in stock",
        )

    cart_item.quantity = data.quantity
    await db.flush()
    return await _build_cart_response(db, current_user.id)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cart_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a single item from the cart."""
    import uuid as _uuid

    try:
        item_uuid = _uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    result = await db.execute(
        select(CartItem).where(CartItem.id == item_uuid, CartItem.user_id == current_user.id)
    )
    cart_item = result.scalar_one_or_none()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    await db.delete(cart_item)
    await db.flush()
    return None


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clear all items from the user's cart."""
    await db.execute(
        delete(CartItem).where(CartItem.user_id == current_user.id)
    )
    await db.flush()
    return None
