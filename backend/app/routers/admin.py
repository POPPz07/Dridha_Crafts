"""
Dridha Crafts - Super Admin Router
All endpoints require admin role. Never expose to customers.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_admin
from app.utils.cache import invalidate_cache
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus, InventoryReservation, ReservationStatus
from app.models.product import Product, ProductVariant
from app.models.review import Wishlist

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------------------------------------------------------------------------
# Request body schemas
# ---------------------------------------------------------------------------

class ShipBody(BaseModel):
    tracking_number: str = Field(..., min_length=1, max_length=100, pattern=r"^[A-Za-z0-9\-_\s]+$")
    carrier: Optional[str] = Field(None, max_length=100)
    tracking_url: Optional[str] = Field(None, max_length=500)
    status_note: Optional[str] = Field(None, max_length=500)
    model_config = {"extra": "forbid"}


class TrackingUpdateBody(BaseModel):
    tracking_number: Optional[str] = Field(None, max_length=100)
    carrier: Optional[str] = Field(None, max_length=100)
    tracking_url: Optional[str] = Field(None, max_length=500)
    status_note: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, pattern=r"^(shipped|delivered|processing|confirmed)$")
    model_config = {"extra": "forbid"}


class DeliverBody(BaseModel):
    status_note: Optional[str] = Field(None, max_length=500)
    model_config = {"extra": "forbid"}


class CancelBody(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)
    model_config = {"extra": "forbid"}


class StockUpdateBody(BaseModel):
    stock_quantity: int = Field(..., ge=0, le=100000)
    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# 1. Stats
# ---------------------------------------------------------------------------

@router.get("/stats")
async def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard stats for the admin panel."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Today orders count
    today_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    )
    today_orders = today_orders_result.scalar() or 0

    # Today revenue (confirmed or paid)
    today_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            and_(
                Order.created_at >= today_start,
                Order.payment_status.in_([
                    PaymentStatus.CONFIRMED.value,
                    PaymentStatus.PAID.value,
                    PaymentStatus.COD_PENDING.value,
                ]),
            )
        )
    )
    today_revenue = float(today_revenue_result.scalar() or 0)

    # Pending verification count
    pending_verification_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.status == OrderStatus.PAYMENT_VERIFICATION.value
        )
    )
    pending_verification = pending_verification_result.scalar() or 0

    # Low stock products (stock_quantity <= 5, is_active=True)
    low_stock_result = await db.execute(
        select(Product.id, Product.name, Product.stock_quantity).where(
            and_(Product.stock_quantity <= 5, Product.is_active == True)
        )
    )
    low_stock_products = [
        {"id": str(row.id), "name": row.name, "stock_quantity": row.stock_quantity}
        for row in low_stock_result.all()
    ]

    # All-time order count
    all_time_result = await db.execute(select(func.count(Order.id)))
    all_time_orders = all_time_result.scalar() or 0

    return {
        "today_orders": today_orders,
        "today_revenue": today_revenue,
        "pending_verification": pending_verification,
        "low_stock_products": low_stock_products,
        "all_time_orders": all_time_orders,
    }


# ---------------------------------------------------------------------------
# 2. Orders list (paginated + filtered)
# ---------------------------------------------------------------------------

@router.get("/orders")
async def list_admin_orders(
    status_filter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Paginated order list with optional status filter."""
    base_query = select(Order).options(selectinload(Order.items))

    if status_filter == "needs_verification":
        base_query = base_query.where(Order.status == OrderStatus.PAYMENT_VERIFICATION.value)
    elif status_filter == "ready_to_pack":
        base_query = base_query.where(Order.status == OrderStatus.CONFIRMED.value)
    elif status_filter == "shipped":
        base_query = base_query.where(Order.status == OrderStatus.SHIPPED.value)
    # else: no filter — return all

    # Count
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    orders_result = await db.execute(
        base_query.order_by(Order.created_at.desc()).offset(offset).limit(page_size)
    )
    orders = orders_result.scalars().all()

    pages = max(1, (total + page_size - 1) // page_size)

    def serialize_order(o: Order):
        return {
            "id": str(o.id),
            "order_number": o.order_number,
            "status": o.status,
            "payment_status": o.payment_status,
            "payment_method": o.payment_method,
            "total": float(o.total),
            "subtotal": float(o.subtotal),
            "shipping_name": o.shipping_name,
            "shipping_phone": o.shipping_phone,
            "shipping_address_line_1": o.shipping_address_line_1,
            "shipping_address_line_2": o.shipping_address_line_2,
            "shipping_city": o.shipping_city,
            "shipping_state": o.shipping_state,
            "shipping_pincode": o.shipping_pincode,
            "tracking_number": o.tracking_number,
            "carrier": getattr(o, "carrier", None),
            "tracking_url": getattr(o, "tracking_url", None),
            "tracking_status_note": getattr(o, "tracking_status_note", None),
            "delivered_at": o.delivered_at.isoformat() if getattr(o, "delivered_at", None) else None,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "updated_at": o.updated_at.isoformat() if o.updated_at else None,
            "cancel_reason": o.cancel_reason,
            "notes": o.notes,
            "items": [
                {
                    "id": str(item.id),
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": float(item.price),
                    "total_price": float(item.total),
                }
                for item in o.items
            ],
        }

    return {
        "orders": [serialize_order(o) for o in orders],
        "total": total,
        "page": page,
        "pages": pages,
    }


# ---------------------------------------------------------------------------
# 3. Approve payment
# ---------------------------------------------------------------------------

@router.put("/orders/{order_id}/approve-payment")
async def approve_payment(
    order_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve a WhatsApp/UPI payment that is pending manual verification."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status != OrderStatus.PAYMENT_VERIFICATION.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is not in payment_verification status (current: {order.status})",
        )

    now = datetime.now(timezone.utc)
    order.status = OrderStatus.CONFIRMED.value
    order.payment_status = PaymentStatus.PAID.value
    order.payment_completed_at = now

    # Commit all inventory reservations
    res_result = await db.execute(
        select(InventoryReservation).where(
            InventoryReservation.order_id == order.id,
        )
    )
    for res in res_result.scalars().all():
        res.status = ReservationStatus.COMMITTED.value
        res.committed_at = now

    await db.flush()
    return {"message": "Payment approved", "order_number": order.order_number}


# ---------------------------------------------------------------------------
# 4. Ship order
# ---------------------------------------------------------------------------

@router.put("/orders/{order_id}/ship")
async def ship_order(
    order_id: uuid.UUID,
    body: ShipBody,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Mark an order as shipped with a tracking number."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status not in [OrderStatus.CONFIRMED.value, OrderStatus.PROCESSING.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order must be in confirmed or processing status to ship (current: {order.status})",
        )

    order.status = OrderStatus.SHIPPED.value
    order.tracking_number = body.tracking_number
    if body.carrier:
        order.carrier = body.carrier
    if body.tracking_url:
        order.tracking_url = body.tracking_url
    if body.status_note:
        order.tracking_status_note = body.status_note

    await db.flush()
    return {"message": "Order marked shipped", "order_number": order.order_number}


# ---------------------------------------------------------------------------
# 4b. Update tracking & status note
# ---------------------------------------------------------------------------

@router.put("/orders/{order_id}/tracking")
async def update_order_tracking(
    order_id: uuid.UUID,
    body: TrackingUpdateBody,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update tracking information, courier partner, tracking URL, and status note."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if body.tracking_number is not None:
        order.tracking_number = body.tracking_number
    if body.carrier is not None:
        order.carrier = body.carrier
    if body.tracking_url is not None:
        order.tracking_url = body.tracking_url
    if body.status_note is not None:
        order.tracking_status_note = body.status_note
    if body.status is not None:
        order.status = body.status
        if body.status == OrderStatus.DELIVERED.value and not order.delivered_at:
            order.delivered_at = datetime.now(timezone.utc)

    await db.flush()
    return {
        "message": "Tracking updated successfully",
        "order_number": order.order_number,
        "status": order.status,
        "carrier": order.carrier,
        "tracking_number": order.tracking_number,
        "tracking_url": order.tracking_url,
        "tracking_status_note": order.tracking_status_note,
    }


# ---------------------------------------------------------------------------
# 4c. Mark order delivered
# ---------------------------------------------------------------------------

@router.put("/orders/{order_id}/deliver")
async def deliver_order(
    order_id: uuid.UUID,
    body: Optional[DeliverBody] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Mark an order as delivered to customer."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.DELIVERED.value
    order.delivered_at = datetime.now(timezone.utc)
    if body and body.status_note:
        order.tracking_status_note = body.status_note

    await db.flush()
    return {"message": "Order marked delivered", "order_number": order.order_number}


# ---------------------------------------------------------------------------
# 5. Cancel order
# ---------------------------------------------------------------------------

@router.put("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: uuid.UUID,
    body: CancelBody,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an order and release inventory reservations."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status in [OrderStatus.DELIVERED.value, OrderStatus.CANCELLED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled (current status: {order.status})",
        )

    now = datetime.now(timezone.utc)
    order.status = OrderStatus.CANCELLED.value
    order.cancel_reason = body.reason or "Cancelled by admin"

    # Release inventory reservations (both RESERVED and COMMITTED) and restore stock
    res_result = await db.execute(
        select(InventoryReservation).where(
            InventoryReservation.order_id == order.id,
            InventoryReservation.status.in_([
                ReservationStatus.RESERVED.value,
                ReservationStatus.COMMITTED.value,
            ]),
        ).with_for_update()
    )
    for res in res_result.scalars().all():
        if res.variant_id:
            v_res = await db.execute(
                select(ProductVariant).where(ProductVariant.id == res.variant_id).with_for_update()
            )
            variant = v_res.scalar_one_or_none()
            if variant:
                variant.stock_quantity += res.quantity
        elif res.product_id:
            p_res = await db.execute(
                select(Product).where(Product.id == res.product_id).with_for_update()
            )
            product = p_res.scalar_one_or_none()
            if product:
                product.stock_quantity += res.quantity

        res.status = ReservationStatus.RELEASED.value
        res.released_at = now

    await db.flush()
    return {"message": "Order cancelled", "order_number": order.order_number}


# ---------------------------------------------------------------------------
# 6. Customers list (paginated)
# ---------------------------------------------------------------------------

@router.get("/customers")
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Paginated customer list with order and wishlist stats."""
    # Total customer count
    total_result = await db.execute(select(func.count(User.id)))
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    pages = max(1, (total + page_size - 1) // page_size)

    users_result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
    )
    users = users_result.scalars().all()

    # Gather order stats per user in bulk
    user_ids = [u.id for u in users]
    order_stats = {}
    wishlist_counts = {}

    if user_ids:
        order_stats_result = await db.execute(
            select(
                Order.user_id,
                func.count(Order.id).label("total_orders"),
                func.coalesce(func.sum(Order.total), 0).label("total_spent"),
            )
            .where(Order.user_id.in_(user_ids))
            .group_by(Order.user_id)
        )
        order_stats = {row.user_id: row for row in order_stats_result.all()}

        # Gather wishlist count per user
        wishlist_result = await db.execute(
            select(
                Wishlist.user_id,
                func.count(Wishlist.id).label("wishlist_count"),
            )
            .where(Wishlist.user_id.in_(user_ids))
            .group_by(Wishlist.user_id)
        )
        wishlist_counts = {row.user_id: row.wishlist_count for row in wishlist_result.all()}

    customers = []
    for u in users:
        stats = order_stats.get(u.id)
        customers.append({
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "total_orders": stats.total_orders if stats else 0,
            "total_spent": float(stats.total_spent) if stats else 0.0,
            "wishlist_count": wishlist_counts.get(u.id, 0),
        })

    return {
        "customers": customers,
        "total": total,
        "page": page,
        "pages": pages,
    }


# ---------------------------------------------------------------------------
# 7. Inventory list
# ---------------------------------------------------------------------------

@router.get("/inventory")
async def list_inventory(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all active products with their current stock levels."""
    result = await db.execute(
        select(Product).where(Product.is_active == True).order_by(Product.name)
    )
    products = result.scalars().all()

    return {
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "stock_quantity": p.stock_quantity,
                "price": float(p.price),
                "is_active": p.is_active,
            }
            for p in products
        ]
    }


# ---------------------------------------------------------------------------
# 8. Update stock
# ---------------------------------------------------------------------------

@router.put("/inventory/{product_id}")
async def update_stock(
    product_id: uuid.UUID,
    body: StockUpdateBody,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update the stock quantity for a product."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.stock_quantity = body.stock_quantity
    await db.flush()
    invalidate_cache("products")
    invalidate_cache("bundles")

    return {
        "message": "Stock updated",
        "product_id": str(product_id),
        "new_stock": product.stock_quantity,
    }
