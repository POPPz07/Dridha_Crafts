"""
Dridha Crafts - Super Admin Router
All endpoints require admin role. Never expose to customers.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from supabase import create_client

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_admin
from app.utils.cache import invalidate_cache
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus, InventoryReservation, ReservationStatus
from app.models.product import Product, ProductVariant
from app.models.review import Wishlist

settings = get_settings()

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------------------------------------------------------------------------
# Request body schemas
# ---------------------------------------------------------------------------

class ShipBody(BaseModel):
    tracking_number: str = Field(..., min_length=1, max_length=100)
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
# 1. Stats (Interactive Live Pulse with Timeframes & Pipeline Telemetry)
# ---------------------------------------------------------------------------

@router.get("/stats")
async def get_admin_stats(
    timeframe: str = Query("today", pattern="^(today|7d|30d|all)$"),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Rich interactive dashboard stats with timeframes, pipeline stages, and recent activity."""
    now = datetime.now(timezone.utc)
    if timeframe == "today":
        window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif timeframe == "7d":
        window_start = now - timedelta(days=7)
    elif timeframe == "30d":
        window_start = now - timedelta(days=30)
    else:
        window_start = None

    # Timeframe orders count
    orders_count_q = select(func.count(Order.id))
    if window_start:
        orders_count_q = orders_count_q.where(Order.created_at >= window_start)
    orders_count_res = await db.execute(orders_count_q)
    period_orders = orders_count_res.scalar() or 0

    # Timeframe revenue (confirmed or paid)
    rev_q = select(func.coalesce(func.sum(Order.total), 0)).where(
        Order.payment_status.in_([
            PaymentStatus.CONFIRMED.value,
            PaymentStatus.PAID.value,
            PaymentStatus.COD_PENDING.value,
        ])
    )
    if window_start:
        rev_q = rev_q.where(Order.created_at >= window_start)
    rev_res = await db.execute(rev_q)
    period_revenue = float(rev_res.scalar() or 0)

    # Cashfree revenue vs WhatsApp UPI revenue in timeframe
    cf_rev_q = select(func.coalesce(func.sum(Order.total), 0)).where(
        and_(
            Order.payment_method == "cashfree",
            Order.payment_status.in_([PaymentStatus.CONFIRMED.value, PaymentStatus.PAID.value]),
        )
    )
    if window_start:
        cf_rev_q = cf_rev_q.where(Order.created_at >= window_start)
    cf_rev_res = await db.execute(cf_rev_q)
    cashfree_revenue = float(cf_rev_res.scalar() or 0)

    wa_rev_q = select(func.coalesce(func.sum(Order.total), 0)).where(
        and_(
            Order.payment_method.in_(["whatsapp_upi", "upi"]),
            Order.payment_status.in_([PaymentStatus.CONFIRMED.value, PaymentStatus.PAID.value]),
        )
    )
    if window_start:
        wa_rev_q = wa_rev_q.where(Order.created_at >= window_start)
    wa_rev_res = await db.execute(wa_rev_q)
    whatsapp_revenue = float(wa_rev_res.scalar() or 0)

    # ── Pipeline Lifecycle Stage Counts (All Active Unarchived) ─────────────────
    pending_verif_res = await db.execute(
        select(func.count(Order.id)).where(
            Order.status.in_([
                OrderStatus.PAYMENT_VERIFICATION.value,
                OrderStatus.PENDING.value,
                OrderStatus.PAYMENT_PENDING.value,
            ])
        )
    )
    pending_verification = pending_verif_res.scalar() or 0

    crafting_res = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PROCESSING.value)
    )
    crafting_count = crafting_res.scalar() or 0

    ready_to_pack_res = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.CONFIRMED.value)
    )
    ready_to_pack_count = ready_to_pack_res.scalar() or 0

    shipped_res = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.SHIPPED.value)
    )
    shipped_count = shipped_res.scalar() or 0

    delivered_res = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.DELIVERED.value)
    )
    delivered_count = delivered_res.scalar() or 0

    all_time_res = await db.execute(select(func.count(Order.id)))
    all_time_orders = all_time_res.scalar() or 0

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

    # Recent 6 orders stream for live activity ticker
    recent_res = await db.execute(
        select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc()).limit(6)
    )
    recent_orders = [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "shipping_name": o.shipping_name,
            "total": float(o.total),
            "status": o.status,
            "payment_method": o.payment_method,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items_count": len(o.items),
        }
        for o in recent_res.scalars().all()
    ]

    return {
        "timeframe": timeframe,
        "today_orders": period_orders,
        "today_revenue": period_revenue,
        "cashfree_revenue": cashfree_revenue,
        "whatsapp_revenue": whatsapp_revenue,
        "pending_verification": pending_verification,
        "crafting_count": crafting_count,
        "ready_to_pack_count": ready_to_pack_count,
        "shipped_count": shipped_count,
        "delivered_count": delivered_count,
        "all_time_orders": all_time_orders,
        "low_stock_products": low_stock_products,
        "recent_orders": recent_orders,
    }


# ---------------------------------------------------------------------------
# 2. Orders list (Paginated + Stage Filter + Universal Search + Sort)
# ---------------------------------------------------------------------------

@router.get("/orders")
async def list_admin_orders(
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Paginated order list with lifecycle stages, sub-filters, search, and sorting."""
    base_query = select(Order).options(selectinload(Order.items))

    # Stage Filter mapping
    if status_filter == "needs_verification":
        base_query = base_query.where(
            Order.status.in_([
                OrderStatus.PAYMENT_VERIFICATION.value,
                OrderStatus.PENDING.value,
                OrderStatus.PAYMENT_PENDING.value,
            ])
        )
    elif status_filter == "crafting":
        base_query = base_query.where(Order.status == OrderStatus.PROCESSING.value)
    elif status_filter == "ready_to_pack":
        base_query = base_query.where(Order.status == OrderStatus.CONFIRMED.value)
    elif status_filter == "shipped":
        base_query = base_query.where(Order.status == OrderStatus.SHIPPED.value)
    elif status_filter == "delivered":
        base_query = base_query.where(Order.status == OrderStatus.DELIVERED.value)
    elif status_filter == "cancelled":
        base_query = base_query.where(
            Order.status.in_([OrderStatus.CANCELLED.value, OrderStatus.REFUNDED.value])
        )
    # else: 'all' or None -> all orders

    # Payment Method filter
    if payment_method and payment_method != "all":
        if payment_method in ["whatsapp_upi", "upi"]:
            base_query = base_query.where(Order.payment_method.in_(["whatsapp_upi", "upi"]))
        else:
            base_query = base_query.where(Order.payment_method == payment_method)

    # Universal Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        base_query = base_query.where(
            or_(
                Order.order_number.ilike(term),
                Order.shipping_name.ilike(term),
                Order.shipping_phone.ilike(term),
                Order.shipping_city.ilike(term),
                Order.tracking_number.ilike(term),
            )
        )

    # Sorting
    if sort_by == "oldest":
        base_query = base_query.order_by(Order.created_at.asc())
    elif sort_by == "amount_high":
        base_query = base_query.order_by(Order.total.desc())
    elif sort_by == "amount_low":
        base_query = base_query.order_by(Order.total.asc())
    else:  # 'newest' default
        base_query = base_query.order_by(Order.created_at.desc())

    # Count
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    orders_result = await db.execute(base_query.offset(offset).limit(page_size))
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
    order.status = OrderStatus.PROCESSING.value
    order.payment_status = PaymentStatus.PAID.value
    order.payment_completed_at = now
    order.tracking_status_note = "Payment verified. Artisan crafting in progress at workshop."

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
    return {"message": "Payment approved. Order moved to Artisan Crafting.", "order_number": order.order_number, "status": order.status}


# ---------------------------------------------------------------------------
# 3b. Advance lifecycle: Start Artisan Crafting (Making in Progress)
# ---------------------------------------------------------------------------

@router.put("/orders/{order_id}/start-crafting")
async def start_order_crafting(
    order_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Advance order to processing (Artisan Crafting in Kashmir atelier)."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.PROCESSING.value
    order.tracking_status_note = "Artisan crafting in progress at Srinagar workshop"
    await db.flush()
    return {
        "message": "Order moved to Artisan Crafting",
        "order_number": order.order_number,
        "status": order.status,
    }


# ---------------------------------------------------------------------------
# 3c. Advance lifecycle: Crafting Complete ➔ Ready to Pack
# ---------------------------------------------------------------------------

@router.put("/orders/{order_id}/ready-to-pack")
async def order_ready_to_pack(
    order_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Advance order from crafting to confirmed (Ready to Pack / Awaiting Dispatch)."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.CONFIRMED.value
    order.tracking_status_note = "Handcrafting complete. Quality inspected & queued for dispatch"
    await db.flush()
    return {
        "message": "Order moved to Ready to Pack",
        "order_number": order.order_number,
        "status": order.status,
    }


# ---------------------------------------------------------------------------
# 3d. Reverse / Step-Back Lifecycle Endpoints (Bidirectional pipeline flow)
# ---------------------------------------------------------------------------

@router.put("/orders/{order_id}/revert-to-verification")
async def revert_order_to_verification(
    order_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revert order from Artisan Crafting back to payment_verification."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.PAYMENT_VERIFICATION.value
    order.payment_status = PaymentStatus.MANUAL_VERIFICATION.value
    order.tracking_status_note = "Payment pending re-verification"
    await db.flush()
    return {
        "message": "Order reverted to Needs Verification",
        "order_number": order.order_number,
        "status": order.status,
    }


@router.put("/orders/{order_id}/revert-to-crafting")
async def revert_order_to_crafting(
    order_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revert order from Ready to Pack back to Artisan Crafting."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.PROCESSING.value
    order.tracking_status_note = "Returned to workshop for artisan refinement"
    await db.flush()
    return {
        "message": "Order reverted to Artisan Crafting",
        "order_number": order.order_number,
        "status": order.status,
    }


@router.put("/orders/{order_id}/revert-to-ready-to-pack")
async def revert_order_to_ready_to_pack(
    order_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revert order from In Transit / Shipped back to Ready to Pack."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.CONFIRMED.value
    order.tracking_status_note = "Returned to packaging station"
    await db.flush()
    return {
        "message": "Order reverted to Ready to Pack",
        "order_number": order.order_number,
        "status": order.status,
    }


@router.put("/orders/{order_id}/revert-to-shipped")
async def revert_order_to_shipped(
    order_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revert order from Delivered back to Shipped / In Transit."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.SHIPPED.value
    order.delivered_at = None
    order.tracking_status_note = "In transit with courier"
    await db.flush()
    return {
        "message": "Order reverted to In Transit",
        "order_number": order.order_number,
        "status": order.status,
    }


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
    order.tracking_number = body.tracking_number.strip()
    if body.carrier:
        order.carrier = body.carrier.strip()
    if body.tracking_url:
        order.tracking_url = body.tracking_url.strip()
    if body.status_note:
        order.tracking_status_note = body.status_note.strip()

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
# 6b. Delete customer account
# ---------------------------------------------------------------------------

@router.delete("/customers/{user_id}")
async def delete_customer(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Safely delete a customer account from database and Supabase Auth."""
    if admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security restriction: Administrators cannot delete their own active account.",
        )

    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found in database.",
        )

    auth_id = target_user.auth_id
    user_identifier = target_user.full_name or target_user.email or str(user_id)

    # 1. Delete from Supabase Auth if service role configured
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and auth_id:
        try:
            sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            try:
                sb.auth.admin.sign_out(auth_id, scope="global")
            except Exception:
                pass
            sb.auth.admin.delete_user(auth_id)
        except Exception:
            pass

    # 2. Delete user from database
    await db.delete(target_user)
    await db.flush()

    return {
        "message": f"Customer '{user_identifier}' was permanently removed.",
        "user_id": str(user_id),
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
