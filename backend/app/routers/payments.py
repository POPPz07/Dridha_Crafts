"""
Dridha Crafts - Payment Router
Orchestrates Cashfree order creation, session generation, status polling, and payment verification.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.order import Order, OrderStatus, PaymentStatus as OrderPaymentStatus
from app.models.payment import (
    Payment,
    PaymentAttempt,
    PaymentEnvironment,
    PaymentGateway,
    PaymentSessionStatus,
)
from app.models.user import User
from app.routers.orders import compute_order_payload_hash, create_order
from app.schemas.order import OrderCreate
from app.schemas.payment import (
    CashfreeCheckoutRequest,
    CashfreeCheckoutResponse,
    PaymentStatusResponse,
)
from app.services.cashfree import CashfreeClient, CashfreeError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])
settings = get_settings()


@router.post("/checkout", response_model=CashfreeCheckoutResponse, status_code=status.HTTP_201_CREATED)
async def create_cashfree_checkout(
    data: CashfreeCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate a Cashfree Hosted Checkout session for an authenticated customer.

    Enforces:
    - Authenticated Supabase customer requirement.
    - Server-side pricing & row-locked inventory reservation.
    - Request idempotency hash & safe payment session reuse.
    - DB transaction committed before calling external Cashfree network API.
    - Payment methods strictly restricted to UPI & Net Banking.
    """
    # 1. Build canonical OrderCreate representation
    order_create_payload = OrderCreate(
        address_id=data.address_id,
        shipping_address=data.shipping_address,
        payment_method="cashfree",
        notes=data.notes,
        items=data.items,
        idempotency_key=data.idempotency_key,
        customer_email=data.customer_email or current_user.email,
        customer_phone=data.customer_phone,
    )
    payload_hash = compute_order_payload_hash(order_create_payload)

    # 2. Check for existing Payment with this idempotency key
    existing_payment_query = (
        select(Payment)
        .join(Order, Order.id == Payment.order_id)
        .where(
            Order.user_id == current_user.id,
            Payment.idempotency_key == data.idempotency_key,
        )
        .options(selectinload(Payment.order))
    )
    existing_res = await db.execute(existing_payment_query)
    existing_payment = existing_res.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if existing_payment:
        # Validate idempotency hash against linked order
        if existing_payment.order.idempotency_hash and existing_payment.order.idempotency_hash != payload_hash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Idempotency key already used with different order payload",
            )

        # Return active, unexpired existing session
        if (
            existing_payment.status == PaymentSessionStatus.ACTIVE.value
            and existing_payment.payment_session_id
            and (existing_payment.expires_at is None or existing_payment.expires_at > now)
        ):
            return CashfreeCheckoutResponse(
                order_id=existing_payment.order.id,
                order_number=existing_payment.order.order_number,
                payment_id=existing_payment.id,
                merchant_order_id=existing_payment.merchant_order_id,
                cf_order_id=existing_payment.cf_order_id,
                payment_session_id=existing_payment.payment_session_id,
                environment=existing_payment.environment,
                amount=existing_payment.amount,
                currency=existing_payment.currency,
            )

    # 3. Create or reuse internal order using trusted order creation service
    order = await create_order(order_create_payload, current_user=current_user, db=db)

    # 4. Create and persist local Payment row in INITIATING state
    merchant_order_id = f"CF_{order.order_number}_{uuid.uuid4().hex[:6]}"
    payment = Payment(
        id=uuid.uuid4(),
        order_id=order.id,
        gateway=PaymentGateway.CASHFREE.value,
        environment=settings.CASHFREE_ENVIRONMENT,
        merchant_order_id=merchant_order_id,
        amount=order.total,
        currency="INR",
        status=PaymentSessionStatus.INITIATING.value,
        idempotency_key=data.idempotency_key,
        expires_at=order.expires_at,
    )
    db.add(payment)
    # Commit DB transaction BEFORE making external network call to Cashfree
    await db.commit()

    # 5. Call Cashfree Create Order API
    cf_client = CashfreeClient(settings=settings)
    try:
        cf_res = await cf_client.create_order(
            order_id=merchant_order_id,
            order_amount=order.total,
            customer_id=str(current_user.id),
            customer_phone=order.shipping_phone,
            customer_name=order.shipping_name,
            customer_email=order.customer_email or current_user.email or "customer@dridhacrafts.com",
            idempotency_key=data.idempotency_key,
            order_expiry_time=order.expires_at.isoformat() if order.expires_at else None,
        )

        payment.cf_order_id = str(cf_res.get("cf_order_id")) if cf_res.get("cf_order_id") else None
        payment.payment_session_id = cf_res.get("payment_session_id")
        payment.status = PaymentSessionStatus.ACTIVE.value
        await db.commit()

    except CashfreeError as exc:
        logger.error("Failed to create Cashfree order for %s: %s", merchant_order_id, str(exc))
        payment.status = PaymentSessionStatus.INITIATION_FAILED.value
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Cashfree payment session creation failed: {str(exc)}",
        ) from exc

    return CashfreeCheckoutResponse(
        order_id=order.id,
        order_number=order.order_number,
        payment_id=payment.id,
        merchant_order_id=payment.merchant_order_id,
        cf_order_id=payment.cf_order_id,
        payment_session_id=payment.payment_session_id,
        environment=payment.environment,
        amount=payment.amount,
        currency=payment.currency,
    )


@router.get("/order/{order_id}/status", response_model=PaymentStatusResponse)
async def get_order_payment_status(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch the latest payment and order status for an owned order.
    Never relies on untrusted URL query parameters.
    """
    stmt = (
        select(Order)
        .options(
            selectinload(Order.payments).selectinload(Payment.attempts),
        )
        .where(Order.id == order_id)
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    latest_payment: Optional[Payment] = None
    if order.payments:
        latest_payment = sorted(order.payments, key=lambda p: p.created_at, reverse=True)[0]

    latest_attempt: Optional[PaymentAttempt] = None
    if latest_payment and latest_payment.attempts:
        latest_attempt = sorted(latest_payment.attempts, key=lambda a: a.created_at, reverse=True)[0]

    return PaymentStatusResponse(
        payment_id=latest_payment.id if latest_payment else uuid.UUID(int=0),
        order_id=order.id,
        order_number=order.order_number,
        merchant_order_id=latest_payment.merchant_order_id if latest_payment else "",
        cf_order_id=latest_payment.cf_order_id if latest_payment else None,
        status=latest_payment.status if latest_payment else "none",
        amount=order.total,
        currency="INR",
        order_status=order.status,
        payment_status=order.payment_status,
        payment_method=latest_attempt.payment_method if latest_attempt else order.payment_method,
        bank_reference=latest_attempt.bank_reference if latest_attempt else None,
    )

