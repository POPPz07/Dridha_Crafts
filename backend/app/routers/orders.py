"""
Dridha Crafts - Orders Router
Endpoints for creating orders, listing user orders, payment confirmation,
admin order status updates, and inventory reservation reconciliation.
"""

import hashlib
import json
import uuid
import uuid as _uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import func, select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_admin, get_current_user, get_optional_user
from app.models.cart import CartItem
from app.models.order import (
    Order,
    OrderItem,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    InventoryReservation,
    ReservationStatus,
)
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
settings = get_settings()


def compute_order_payload_hash(data: OrderCreate) -> str:
    """
    Compute canonical SHA-256 hash of the order creation payload
    to detect idempotency key reuse with different contents.
    """
    items_data = []
    if data.items:
        for item in sorted(data.items, key=lambda x: (str(x.product_id), str(x.variant_id or ""))):
            items_data.append({
                "product_id": str(item.product_id),
                "variant_id": str(item.variant_id) if item.variant_id else None,
                "quantity": item.quantity,
            })

    address_dict = None
    if data.shipping_address:
        address_dict = {
            "full_name": data.shipping_address.full_name,
            "phone": data.shipping_address.phone,
            "address_line_1": data.shipping_address.address_line_1,
            "address_line_2": data.shipping_address.address_line_2,
            "city": data.shipping_address.city,
            "state": data.shipping_address.state,
            "pincode": data.shipping_address.pincode,
        }

    canonical = {
        "payment_method": data.payment_method,
        "address_id": str(data.address_id) if data.address_id else None,
        "shipping_address": address_dict,
        "items": items_data,
    }
    raw = json.dumps(canonical, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


async def release_expired_reservations(db: AsyncSession) -> int:
    """
    Core inventory reservation expiry logic.
    Releases all pending reservations whose expires_at is past now(),
    restores product/variant stock atomically, and cancels unpaid orders.
    """
    now = datetime.now(timezone.utc)
    expired_res = await db.execute(
        select(InventoryReservation)
        .where(
            InventoryReservation.status == ReservationStatus.RESERVED.value,
            InventoryReservation.expires_at <= now,
        )
        .with_for_update()
    )
    reservations = expired_res.scalars().all()
    count = 0

    for r in reservations:
        if r.variant_id:
            v_res = await db.execute(
                select(ProductVariant).where(ProductVariant.id == r.variant_id).with_for_update()
            )
            v = v_res.scalar_one_or_none()
            if v:
                v.stock_quantity += r.quantity
        elif r.product_id:
            p_res = await db.execute(
                select(Product).where(Product.id == r.product_id).with_for_update()
            )
            p = p_res.scalar_one_or_none()
            if p:
                p.stock_quantity += r.quantity

        r.status = ReservationStatus.RELEASED.value
        r.released_at = now
        count += 1

        # Transition order to CANCELLED if still pending payment or past manual verification window
        order = await db.get(Order, r.order_id)
        if order and order.status in [
            OrderStatus.PENDING.value,
            OrderStatus.PAYMENT_PENDING.value,
            OrderStatus.PAYMENT_VERIFICATION.value,
        ]:
            order.status = OrderStatus.CANCELLED.value
            order.cancel_reason = (
                "Manual verification window expired"
                if order.status == OrderStatus.PAYMENT_VERIFICATION.value
                else "Payment reservation expired"
            )

    if count > 0:
        await db.flush()

    return count


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create an order from the user's cart or directly provided items.

    Enforces:
    - Authenticated customer requirement (Task 1).
    - Address ownership verification (Task 1).
    - Request payload idempotency hash & concurrent double-click protection (Task 3).
    - Row-locked stock validation and reservation creation (Task 2 & 3).
    """
    payload_hash = compute_order_payload_hash(data) if data.idempotency_key else None

    # 0. Idempotency Check (Sequential duplicate requests)
    if data.idempotency_key:
        idem_query = (
            select(Order)
            .options(selectinload(Order.items))
            .where(
                Order.user_id == current_user.id,
                Order.idempotency_key == data.idempotency_key,
            )
        )
        existing_res = await db.execute(idem_query)
        existing_order = existing_res.scalar_one_or_none()
        if existing_order:
            if existing_order.idempotency_hash and existing_order.idempotency_hash != payload_hash:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key already used with different order payload",
                )
            return existing_order

    # 1. Validate shipping address (Ensures address belongs to authenticated user)
    if data.address_id:
        address = await db.get(Address, data.address_id)
        if not address or address.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipping address not found",
            )
        shipping_name = address.full_name
        shipping_phone = address.phone
        shipping_address_line_1 = address.address_line_1
        shipping_address_line_2 = address.address_line_2
        shipping_city = address.city
        shipping_state = address.state
        shipping_pincode = address.pincode
    elif data.shipping_address:
        sa = data.shipping_address
        new_address = Address(
            user_id=current_user.id,
            full_name=sa.full_name,
            phone=sa.phone,
            address_line_1=sa.address_line_1,
            address_line_2=sa.address_line_2,
            city=sa.city,
            state=sa.state,
            pincode=sa.pincode,
            is_default=False,
        )
        db.add(new_address)
        shipping_name = sa.full_name
        shipping_phone = sa.phone
        shipping_address_line_1 = sa.address_line_1
        shipping_address_line_2 = sa.address_line_2
        shipping_city = sa.city
        shipping_state = sa.state
        shipping_pincode = sa.pincode
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either address_id or shipping_address must be provided",
        )

    # 2 & 3. Load items, lock rows, validate stock, and build order items
    order_items: list[OrderItem] = []
    subtotal = Decimal("0.00")

    if data.items and len(data.items) > 0:
        # Sort items deterministically to avoid database lock deadlocks
        sorted_items = sorted(data.items, key=lambda x: (str(x.product_id), str(x.variant_id or "")))
        for item_in in sorted_items:
            prod_result = await db.execute(
                select(Product)
                .where(Product.id == item_in.product_id, Product.is_active == True)
                .options(selectinload(Product.images))
                .with_for_update()
            )
            product = prod_result.scalar_one_or_none()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product '{item_in.product_id}' not found or inactive",
                )

            variant = None
            if item_in.variant_id:
                var_result = await db.execute(
                    select(ProductVariant)
                    .where(
                        ProductVariant.id == item_in.variant_id,
                        ProductVariant.product_id == product.id,
                        ProductVariant.is_active == True,
                    )
                    .with_for_update()
                )
                variant = var_result.scalar_one_or_none()
                if not variant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Variant '{item_in.variant_id}' not found or inactive",
                    )

            available = variant.stock_quantity if variant else product.stock_quantity
            if item_in.quantity > available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Available: {available}",
                )

            unit_price = variant.price_override if variant and variant.price_override else product.price
            line_total = unit_price * item_in.quantity
            subtotal += line_total

            image_url = None
            if product.images:
                image_url = next(
                    (img.image_url for img in product.images if img.is_primary),
                    product.images[0].image_url if product.images else None,
                )

            order_items.append(
                OrderItem(
                    id=uuid.uuid4(),
                    product_id=product.id,
                    variant_id=variant.id if variant else None,
                    product_name=product.name,
                    product_slug=product.slug,
                    variant_name=variant.variant_name if variant else None,
                    price=unit_price,
                    quantity=item_in.quantity,
                    total=line_total,
                    image_url=image_url,
                )
            )

            # Atomic decrement
            if variant:
                variant.stock_quantity -= item_in.quantity
            else:
                product.stock_quantity -= item_in.quantity
    else:
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

        sorted_cart = sorted(cart_items, key=lambda x: (str(x.product_id), str(x.variant_id or "")))
        for ci in sorted_cart:
            prod_result = await db.execute(
                select(Product)
                .where(Product.id == ci.product_id, Product.is_active == True)
                .options(selectinload(Product.images))
                .with_for_update()
            )
            product = prod_result.scalar_one_or_none()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product '{ci.product_id}' not found or inactive",
                )

            variant = None
            if ci.variant_id:
                var_result = await db.execute(
                    select(ProductVariant)
                    .where(
                        ProductVariant.id == ci.variant_id,
                        ProductVariant.product_id == product.id,
                        ProductVariant.is_active == True,
                    )
                    .with_for_update()
                )
                variant = var_result.scalar_one_or_none()

            available = variant.stock_quantity if variant else product.stock_quantity
            if ci.quantity > available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Available: {available}",
                )

            unit_price = variant.price_override if variant and variant.price_override else product.price
            line_total = unit_price * ci.quantity
            subtotal += line_total

            image_url = None
            if product.images:
                image_url = next(
                    (img.image_url for img in product.images if img.is_primary),
                    product.images[0].image_url if product.images else None,
                )

            order_items.append(
                OrderItem(
                    id=uuid.uuid4(),
                    product_id=product.id,
                    variant_id=variant.id if variant else None,
                    product_name=product.name,
                    product_slug=product.slug,
                    variant_name=variant.variant_name if variant else None,
                    price=unit_price,
                    quantity=ci.quantity,
                    total=line_total,
                    image_url=image_url,
                )
            )

            # Atomic decrement
            if variant:
                variant.stock_quantity -= ci.quantity
            else:
                product.stock_quantity -= ci.quantity

    # 4. Determine initial statuses and reservation window
    payment_method_value = data.payment_method
    now = datetime.now(timezone.utc)

    if payment_method_value == "cod":
        initial_payment_status = PaymentStatus.COD_PENDING.value
        initial_order_status = OrderStatus.CONFIRMED.value
        res_status = ReservationStatus.COMMITTED.value
        expires_at = None
    else:
        initial_payment_status = PaymentStatus.PENDING.value
        initial_order_status = OrderStatus.PAYMENT_PENDING.value
        res_status = ReservationStatus.RESERVED.value
        # 30-minute reservation window for pending online / manual payments
        expires_at = now + timedelta(minutes=30)

    # Free shipping
    shipping_cost = Decimal("0.00")
    total = subtotal + shipping_cost

    customer_email = data.customer_email or current_user.email
    customer_phone = data.customer_phone or current_user.phone or shipping_phone

    # 5. Create order
    order_id = uuid.uuid4()
    order = Order(
        id=order_id,
        order_number=generate_order_number(),
        user_id=current_user.id,
        customer_email=customer_email,
        customer_phone=customer_phone,
        idempotency_key=data.idempotency_key,
        idempotency_hash=payload_hash,
        expires_at=expires_at,
        shipping_name=shipping_name,
        shipping_phone=shipping_phone,
        shipping_address_line_1=shipping_address_line_1,
        shipping_address_line_2=shipping_address_line_2,
        shipping_city=shipping_city,
        shipping_state=shipping_state,
        shipping_pincode=shipping_pincode,
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

    # 6. Create inventory reservation rows
    for item in order_items:
        reservation = InventoryReservation(
            id=uuid.uuid4(),
            order_id=order_id,
            order_item_id=item.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            status=res_status,
            expires_at=expires_at or (now + timedelta(days=365)),
            committed_at=now if res_status == ReservationStatus.COMMITTED.value else None,
        )
        db.add(reservation)

    # 7. Atomic commit with concurrent race protection
    try:
        await db.flush()
        # Clear server cart after successful order creation
        await db.execute(
            delete(CartItem).where(CartItem.user_id == current_user.id)
        )
    except IntegrityError:
        await db.rollback()
        # Concurrent duplicate request won the insert race. Re-fetch winning order.
        if data.idempotency_key:
            existing_res = await db.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(
                    Order.user_id == current_user.id,
                    Order.idempotency_key == data.idempotency_key,
                )
            )
            existing_order = existing_res.scalar_one_or_none()
            if existing_order:
                if existing_order.idempotency_hash and existing_order.idempotency_hash != payload_hash:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Idempotency key already used with different order payload",
                    )
                return existing_order

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict processing order request. Please retry.",
        )

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
    count_result = await db.execute(
        select(func.count(Order.id)).where(Order.user_id == current_user.id)
    )
    total = count_result.scalar() or 0

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
    User submits QR/UPI payment confirmation with transaction ID / UTR.

    Policy:
    - Submitting UTR moves status to PAYMENT_VERIFICATION and MANUAL_VERIFICATION.
    - Submitting UTR does NOT commit stock (requires admin approval).
    - Extends reservation expiry to 24 hours to protect inventory during admin review window.
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

    now = datetime.now(timezone.utc)
    # 24-hour manual verification window
    manual_verification_deadline = now + timedelta(hours=24)

    order.payment_status = PaymentStatus.MANUAL_VERIFICATION.value
    order.status = OrderStatus.PAYMENT_VERIFICATION.value
    order.expires_at = manual_verification_deadline

    tx_id = data.transaction_id or data.utr_number
    if tx_id:
        order.notes = (
            f"{order.notes}\nTransaction ID: {tx_id}"
            if order.notes
            else f"Transaction ID: {tx_id}"
        )

    # Extend active reservations so they do not expire during the admin review period.
    # Stock remains RESERVED until admin approves.
    res_result = await db.execute(
        select(InventoryReservation).where(
            InventoryReservation.order_id == order.id,
            InventoryReservation.status == ReservationStatus.RESERVED.value,
        )
    )
    for res in res_result.scalars().all():
        res.expires_at = manual_verification_deadline

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

    Rules:
    - Admin approval (CONFIRMED): commits active reservations.
    - Admin rejection / cancellation (CANCELLED): releases active reservations and restores stock.
    - Duplicate admin calls cannot restore stock twice (only acts on RESERVED/COMMITTED reservations).
    - REFUNDED: updates payment status; only restores stock if data.restore_stock=True.
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

    now = datetime.now(timezone.utc)

    # 1. Commit reservations on admin confirmation/approval
    if data.status == OrderStatus.CONFIRMED.value:
        res_result = await db.execute(
            select(InventoryReservation).where(
                InventoryReservation.order_id == order.id,
                InventoryReservation.status == ReservationStatus.RESERVED.value,
            )
        )
        for r in res_result.scalars().all():
            r.status = ReservationStatus.COMMITTED.value
            r.committed_at = now

        if order.payment_status == PaymentStatus.MANUAL_VERIFICATION.value:
            order.payment_status = PaymentStatus.CONFIRMED.value
            order.payment_completed_at = now

    # 2. Release reservations and safely restore inventory
    should_restore = False
    if (
        data.status == OrderStatus.CANCELLED.value
        and order.status not in [OrderStatus.CANCELLED.value, OrderStatus.REFUNDED.value]
    ):
        should_restore = True
    elif data.status == OrderStatus.REFUNDED.value and data.restore_stock:
        should_restore = True

    if should_restore:
        # Check active reservations
        res_query = await db.execute(
            select(InventoryReservation).where(
                InventoryReservation.order_id == order.id,
                InventoryReservation.status.in_([
                    ReservationStatus.RESERVED.value,
                    ReservationStatus.COMMITTED.value,
                ]),
            ).with_for_update()
        )
        active_reservations = res_query.scalars().all()

        if active_reservations:
            for r in active_reservations:
                if r.variant_id:
                    v_res = await db.execute(
                        select(ProductVariant).where(ProductVariant.id == r.variant_id).with_for_update()
                    )
                    variant = v_res.scalar_one_or_none()
                    if variant:
                        variant.stock_quantity += r.quantity
                elif r.product_id:
                    p_res = await db.execute(
                        select(Product).where(Product.id == r.product_id).with_for_update()
                    )
                    product = p_res.scalar_one_or_none()
                    if product:
                        product.stock_quantity += r.quantity

                r.status = ReservationStatus.RELEASED.value
                r.released_at = now
        else:
            # Fallback for historical orders without reservation records
            for item in order.items:
                if item.variant_id:
                    v_res = await db.execute(
                        select(ProductVariant).where(ProductVariant.id == item.variant_id).with_for_update()
                    )
                    variant = v_res.scalar_one_or_none()
                    if variant:
                        variant.stock_quantity += item.quantity
                elif item.product_id:
                    p_res = await db.execute(
                        select(Product).where(Product.id == item.product_id).with_for_update()
                    )
                    product = p_res.scalar_one_or_none()
                    if product:
                        product.stock_quantity += item.quantity

    if data.cancel_reason:
        order.cancel_reason = data.cancel_reason
    if data.tracking_number:
        order.tracking_number = data.tracking_number

    order.status = data.status
    await db.flush()
    return order


@router.post("/reservations/expire")
async def trigger_expire_reservations(
    db: AsyncSession = Depends(get_db),
    x_cron_key: str | None = Header(None, alias="X-Cron-Key"),
    current_admin: User | None = Depends(get_optional_user),
):
    """
    Scheduled worker endpoint: Releases expired inventory reservations.
    Can be authorized via either:
    1. An authenticated admin user JWT, OR
    2. A valid X-Cron-Key header matching settings.CRON_SECRET.
    """
    is_authorized = False
    if current_admin and current_admin.role == "admin":
        is_authorized = True
    elif settings.CRON_SECRET and x_cron_key == settings.CRON_SECRET:
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access or valid cron authorization required",
        )

    count = await release_expired_reservations(db)
    return {"status": "ok", "released_reservations": count}
