"""
Dridha Crafts - Payment Router
Orchestrates Cashfree order creation, session generation, status polling, and payment verification.
"""

import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.order import (
    InventoryReservation,
    Order,
    OrderStatus,
    PaymentStatus as OrderPaymentStatus,
    ReservationStatus,
)
from app.models.payment import (
    Payment,
    PaymentAttempt,
    PaymentAttemptStatus,
    PaymentEnvironment,
    PaymentEvent,
    PaymentGateway,
    PaymentSessionStatus,
    WebhookProcessingStatus,
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
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch the latest payment and order status for an owned order (Phase 8).
    Accepts internal Order UUID, order_number, or Cashfree merchant_order_id.
    Includes server-side reconciliation fallback if webhook is delayed.
    """
    order = None
    try:
        parsed_uuid = uuid.UUID(order_id)
        stmt = (
            select(Order)
            .options(
                selectinload(Order.payments).selectinload(Payment.attempts),
            )
            .where(Order.id == parsed_uuid)
        )
        res = await db.execute(stmt)
        order = res.scalar_one_or_none()
    except ValueError:
        pass

    if not order:
        stmt = (
            select(Order)
            .options(
                selectinload(Order.payments).selectinload(Payment.attempts),
            )
            .outerjoin(Payment, Payment.order_id == Order.id)
            .where(
                (Order.order_number == order_id)
                | (Payment.merchant_order_id == order_id)
                | (Payment.cf_order_id == order_id)
            )
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

    # Server-side reconciliation if payment is still pending and Cashfree is configured
    if (
        order.payment_status != OrderPaymentStatus.PAID.value
        and latest_payment
        and latest_payment.merchant_order_id
        and settings.CASHFREE_CLIENT_ID
        and settings.CASHFREE_CLIENT_SECRET
    ):
        try:
            cf_client = CashfreeClient(settings=settings)
            attempts_data = await cf_client.get_order_payments(latest_payment.merchant_order_id)
            now = datetime.now(timezone.utc)
            for att in attempts_data:
                provider_status = str(att.get("payment_status", "")).upper()
                if provider_status == "SUCCESS":
                    latest_payment.status = PaymentSessionStatus.PAID.value
                    if att.get("cf_payment_id") and not latest_payment.cf_order_id:
                        latest_payment.cf_order_id = str(att.get("cf_order_id") or "")

                    order.payment_status = OrderPaymentStatus.PAID.value
                    order.status = OrderStatus.CONFIRMED.value
                    order.payment_completed_at = now

                    # Commit stock reservations
                    res_stmt = select(InventoryReservation).where(
                        InventoryReservation.order_id == order.id,
                        InventoryReservation.status == ReservationStatus.RESERVED.value,
                    )
                    res_result = await db.execute(res_stmt)
                    for r in res_result.scalars().all():
                        r.status = ReservationStatus.COMMITTED.value
                        r.committed_at = now

                    new_att = PaymentAttempt(
                        id=uuid.uuid4(),
                        payment_id=latest_payment.id,
                        cf_payment_id=str(att.get("cf_payment_id") or "") or None,
                        payment_status=PaymentAttemptStatus.SUCCESS.value,
                        provider_status=provider_status,
                        payment_amount=Decimal(str(att.get("payment_amount", order.total))),
                        currency="INR",
                        payment_method=att.get("payment_group") or "upi",
                        bank_reference=att.get("bank_reference"),
                        payment_message=att.get("payment_message"),
                        payment_time=now,
                        payment_completed_at=now,
                    )
                    db.add(new_att)
                    await db.commit()
                    latest_attempt = new_att
                    break
        except Exception as exc:
            logger.warning("Status reconciliation failed for order %s: %s", order.order_number, str(exc))

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




@router.post("/webhook", status_code=status.HTTP_200_OK)
@router.post("/cashfree/webhook", status_code=status.HTTP_200_OK)
async def cashfree_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Public webhook receiver for Cashfree payment lifecycle events (Phase 7).

    Guarantees:
    1. Reads raw unparsed bytes for cryptographic HMAC-SHA256 signature verification.
    2. Validates timestamp and signature headers.
    3. Idempotently deduplicates events using payload SHA-256 hash.
    4. Row-locks payment and internal order records during state transition.
    5. Validates amount, currency (INR), and order ownership.
    6. On SUCCESS: commits inventory reservations and marks order as confirmed/paid.
    7. On FAILURE/DROP: logs payment attempt without downgrading an already-paid order.
    8. Records audit trail in payment_events table.
    """
    raw_body = await request.body()
    payload_hash = hashlib.sha256(raw_body).hexdigest()

    signature = (
        request.headers.get("x-webhook-signature")
        or request.headers.get("x-cashfree-signature")
        or ""
    )
    timestamp = (
        request.headers.get("x-webhook-timestamp")
        or request.headers.get("x-cashfree-timestamp")
        or ""
    )

    now = datetime.now(timezone.utc)

    # 1. Check for missing signature headers
    if not signature or not timestamp:
        logger.warning("Rejected Cashfree webhook missing signature/timestamp headers")
        invalid_event = PaymentEvent(
            id=uuid.uuid4(),
            gateway=PaymentGateway.CASHFREE.value,
            event_type="UNKNOWN",
            payload_hash=payload_hash,
            signature_verified=False,
            processing_status=WebhookProcessingStatus.FAILED.value,
            error_message="Missing webhook signature or timestamp headers",
            received_at=now,
        )
        db.add(invalid_event)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing webhook signature or timestamp headers",
        )

    # 2. Verify HMAC-SHA256 signature against unparsed raw body
    cf_client = CashfreeClient(settings=settings)
    is_valid = cf_client.verify_webhook_signature(raw_body, timestamp, signature)
    if not is_valid:
        logger.warning("Invalid Cashfree webhook signature received")
        invalid_event = PaymentEvent(
            id=uuid.uuid4(),
            gateway=PaymentGateway.CASHFREE.value,
            event_type="UNKNOWN",
            payload_hash=payload_hash,
            signature_verified=False,
            processing_status=WebhookProcessingStatus.FAILED.value,
            error_message="Invalid webhook signature",
            received_at=now,
        )
        db.add(invalid_event)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        )

    # 3. Check for duplicate event (idempotency by payload_hash)
    existing_event_query = select(PaymentEvent).where(
        PaymentEvent.payload_hash == payload_hash,
        PaymentEvent.processing_status == WebhookProcessingStatus.PROCESSED.value,
    )
    existing_event_res = await db.execute(existing_event_query)
    if existing_event_res.scalar_one_or_none():
        logger.info("Duplicate webhook event ignored (hash=%s)", payload_hash[:12])
        return {"status": "ok", "message": "Duplicate event already processed"}

    # 4. Parse payload
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed JSON payload: {str(exc)}",
        )

    event_type = payload.get("type", "PAYMENT_WEBHOOK")
    data = payload.get("data", {})
    order_data = data.get("order", {})
    payment_data = data.get("payment", {})

    merchant_order_id = order_data.get("order_id")
    cf_order_id = str(order_data.get("cf_order_id") or "")
    cf_payment_id = str(payment_data.get("cf_payment_id") or "")
    payment_status_raw = str(payment_data.get("payment_status", "")).upper()
    payment_amount_raw = payment_data.get("payment_amount", order_data.get("order_amount", 0))
    currency = payment_data.get("payment_currency", order_data.get("order_currency", "INR"))

    try:
        payment_amount = Decimal(str(payment_amount_raw))
    except Exception:
        payment_amount = Decimal("0.00")

    # 5. Correlate local Payment record with row lock
    payment_query = (
        select(Payment)
        .where(
            (Payment.merchant_order_id == merchant_order_id)
            | (Payment.cf_order_id == cf_order_id)
        )
        .with_for_update()
    )
    payment_res = await db.execute(payment_query)
    payment = payment_res.scalar_one_or_none()

    if not payment:
        logger.error("Webhook received for unknown order: %s", merchant_order_id)
        unknown_event = PaymentEvent(
            id=uuid.uuid4(),
            gateway=PaymentGateway.CASHFREE.value,
            event_type=event_type,
            payload_hash=payload_hash,
            signature_verified=True,
            processing_status=WebhookProcessingStatus.FAILED.value,
            error_message=f"No local payment found for order {merchant_order_id}",
            payload=payload,
            received_at=now,
        )
        db.add(unknown_event)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment record not found for {merchant_order_id}",
        )

    # 6. Fetch linked internal Order with row lock
    order_query = select(Order).where(Order.id == payment.order_id).with_for_update()
    order_res = await db.execute(order_query)
    order = order_res.scalar_one()

    # 7. Validate Currency and Amount
    if currency != "INR":
        logger.error("Unexpected currency in webhook: %s", currency)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Currency must be INR",
        )

    # If amount mismatch on SUCCESS, reject to prevent underpayment exploits
    if payment_status_raw == "SUCCESS" and payment_amount < order.total:
        logger.error("Payment underpaid: received %s expected %s", payment_amount, order.total)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount mismatch",
        )

    # 8. Record or update PaymentAttempt
    attempt_status = PaymentAttemptStatus.PENDING.value
    if payment_status_raw == "SUCCESS":
        attempt_status = PaymentAttemptStatus.SUCCESS.value
    elif payment_status_raw in ("FAILED", "CANCELLED"):
        attempt_status = PaymentAttemptStatus.FAILED.value
    elif payment_status_raw == "USER_DROPPED":
        attempt_status = PaymentAttemptStatus.USER_DROPPED.value

    payment_method_group = payment_data.get("payment_group") or "upi"
    bank_reference = payment_data.get("bank_reference")
    payment_message = payment_data.get("payment_message")

    attempt = PaymentAttempt(
        id=uuid.uuid4(),
        payment_id=payment.id,
        cf_payment_id=cf_payment_id or None,
        payment_status=attempt_status,
        provider_status=payment_status_raw,
        payment_amount=payment_amount if payment_amount > 0 else order.total,
        currency="INR",
        payment_method=payment_method_group,
        bank_reference=bank_reference,
        payment_message=payment_message,
        payment_time=now,
        payment_completed_at=now if payment_status_raw == "SUCCESS" else None,
    )
    db.add(attempt)
    await db.flush()

    # 9. Apply State Transitions
    if payment_status_raw == "SUCCESS":
        payment.status = PaymentSessionStatus.PAID.value
        if cf_order_id and not payment.cf_order_id:
            payment.cf_order_id = cf_order_id

        order.payment_status = OrderPaymentStatus.PAID.value
        order.status = OrderStatus.CONFIRMED.value
        order.payment_completed_at = now

        # Commit stock reservations atomically
        res_stmt = select(InventoryReservation).where(
            InventoryReservation.order_id == order.id,
            InventoryReservation.status == ReservationStatus.RESERVED.value,
        )
        res_result = await db.execute(res_stmt)
        for r in res_result.scalars().all():
            r.status = ReservationStatus.COMMITTED.value
            r.committed_at = now

        logger.info("Order %s marked PAID via Cashfree webhook", order.order_number)

    elif payment_status_raw in ("FAILED", "CANCELLED", "USER_DROPPED"):
        # Rule 12: A stale failed event must not downgrade an already verified successful payment
        if order.payment_status != OrderPaymentStatus.PAID.value:
            logger.info("Payment attempt failed for order %s: %s", order.order_number, payment_status_raw)
            if payment_status_raw == "FAILED":
                payment.status = PaymentSessionStatus.FAILED.value
        else:
            logger.warning("Ignoring %s webhook for already PAID order %s", payment_status_raw, order.order_number)

    # 10. Record verified PaymentEvent audit log
    event = PaymentEvent(
        id=uuid.uuid4(),
        payment_id=payment.id,
        payment_attempt_id=attempt.id,
        gateway=PaymentGateway.CASHFREE.value,
        event_type=event_type,
        webhook_version=request.headers.get("x-api-version") or "2023-08-01",
        cf_event_id=str(payload.get("event_id") or data.get("event_id") or ""),
        payload_hash=payload_hash,
        signature_verified=True,
        processing_status=WebhookProcessingStatus.PROCESSED.value,
        payload=payload,
        received_at=now,
        processed_at=now,
    )
    db.add(event)

    # 11. Atomic Commit
    await db.commit()

    return {
        "status": "ok",
        "message": "Webhook processed successfully",
        "order_number": order.order_number,
    }
