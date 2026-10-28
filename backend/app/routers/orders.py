"""
Dridha Crafts - Orders Router
Endpoints for creating orders, listing user orders, payment confirmation,
and admin order status updates.
"""

import uuid as _uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_admin, get_current_user
from app.models.cart import CartItem
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus
from app.models.product import Product, ProductVariant
from app.models.user import Address, User
from app.schemas.order import (
    OrderCreate,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
    PaymentConfirmation,
)
from app.schemas.product import PaginatedResponse
from app.utils.security import generate_order_number

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create an order from the user's current cart.

    Steps:
    1. Validate the shipping address belongs to the user.
    2. Load cart items with product data.
    3. Validate stock availability for each item.
    4. Snapshot product data into order items.
    5. Calculate totals.
    6. Create the order and clear the cart.
    """
    # 1. Validate address
    address = await db.get(Address, data.address_id)
    if not address or address.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping address not found",
        )

    # 2. Load cart items
    cart_result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .options(
            selectinload(CartItem.product).selectinload(Product.images),
            selectinload(CartItem.variant),
        )
    )
    cart_items = cart_result.scalars().all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    # 3 & 4. Validate stock and build order items
    order_items = []
    subtotal = Decimal("0.00")

    for ci in cart_items:
        product = ci.product
        variant = ci.variant

        # Check stock
        available = variant.stock_quantity if variant else product.stock_quantity
        if ci.quantity > available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {available}",
            )

        # Determine price
        unit_price = variant.price_override if variant and variant.price_override else product.price
        line_total = unit_price * ci.quantity
        subtotal += line_total

        # Primary image
        image_url = None
        if product.images:
            image_url = next(
                (img.image_url for img in product.images if img.is_primary),
                product.images[0].image_url if product.images else None,
            )

        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                product_slug=product.slug,
                variant_name=variant.variant_name if variant else None,
                price=unit_price,
                quantity=ci.quantity,
                total=line_total,
                image_url=image_url,
            )
        )

        # Decrement stock
        if variant:
            variant.stock_quantity -= ci.quantity
        else:
            product.stock_quantity -= ci.quantity

    # 5. Determine payment status
    payment_method_value = data.payment_method
    if payment_method_value == "cod":
        initial_payment_status = PaymentStatus.COD_PENDING.value
        initial_order_status = OrderStatus.CONFIRMED.value
    else:
        initial_payment_status = PaymentStatus.PENDING.value
        initial_order_status = OrderStatus.PAYMENT_PENDING.value

    # Shipping cost (free shipping for now)
    shipping_cost = Decimal("0.00")
    total = subtotal + shipping_cost

    # 6. Create order
    order = Order(
        order_number=generate_order_number(),
        user_id=current_user.id,
        shipping_name=address.full_name,
        shipping_phone=address.phone,
        shipping_address_line_1=address.address_line_1,
        shipping_address_line_2=address.address_line_2,
        shipping_city=address.city,
        shipping_state=address.state,
        shipping_pincode=address.pincode,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        discount=Decimal("0.00"),
        total=total,
        status=initial_order_status,
        payment_method=payment_method_value,
        payment_status=initial_payment_status,
        notes=data.notes,
        items=order_items,
    )
    db.add(order)

    # Clear cart
    await db.execute(
        delete(CartItem).where(CartItem.user_id == current_user.id)
    )

    await db.flush()

    # Reload with items for response
    await db.refresh(order, attribute_names=["items"])
    return order


@router.get("", response_model=PaginatedResponse[OrderListResponse])
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the current user's orders with pagination."""
    # Total count
    count_result = await db.execute(
        select(func.count(Order.id)).where(Order.user_id == current_user.id)
    )
    total = count_result.scalar() or 0

    # Fetch orders with item count
    query = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(query)
    orders = result.scalars().all()

    items = [
        OrderListResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            total=order.total,
            payment_method=order.payment_method,
            payment_status=order.payment_status,
            item_count=len(order.items),
            created_at=order.created_at,
        )
        for order in orders
    ]

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: _uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed order information. Users can only view their own orders."""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order


@router.put("/{order_id}/confirm-payment", response_model=OrderResponse)
async def confirm_payment(
    order_id: _uuid.UUID,
    data: PaymentConfirmation,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    User confirms QR/UPI payment for an order.

    Sets payment status to manual_verification so admin can verify.
    """
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.payment_status != PaymentStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm payment for order with status '{order.payment_status}'",
        )

    order.payment_status = PaymentStatus.MANUAL_VERIFICATION.value
    order.status = OrderStatus.PAYMENT_VERIFICATION.value
    if data.transaction_id:
        order.notes = (
            f"{order.notes}\nTransaction ID: {data.transaction_id}"
            if order.notes
            else f"Transaction ID: {data.transaction_id}"
        )

    await db.flush()
    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: _uuid.UUID,
    data: OrderStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin-only: update the status of an order.

    Optionally set a tracking number (e.g., when status is 'shipped').
    """
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    order.status = data.status

    # Auto-update payment status when admin confirms the order
    if data.status == OrderStatus.CONFIRMED.value and order.payment_status == PaymentStatus.MANUAL_VERIFICATION.value:
        order.payment_status = PaymentStatus.CONFIRMED.value

    if data.tracking_number:
        order.tracking_number = data.tracking_number

    await db.flush()
    return order
