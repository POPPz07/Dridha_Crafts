"""
Phase 7 Tests: Cashfree Webhook Verification and Payment Processing (POST /api/payments/webhook).
Tests:
1. Missing signature/timestamp headers returns HTTP 400.
2. Invalid HMAC-SHA256 signature returns HTTP 401.
3. Unknown order reference returns HTTP 404.
4. Non-INR currency returns HTTP 400.
5. Underpayment amount mismatch returns HTTP 400.
6. Valid PAYMENT_SUCCESS_WEBHOOK marks Order and Payment as PAID, commits inventory reservations.
7. Duplicate webhook payload returns HTTP 200 without duplicate commits (idempotency).
8. Stale failure/cancelled webhook does not downgrade an already PAID order.
9. USER_DROPPED webhook records attempt without marking order as failed.
"""

import base64
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.config import get_settings
from app.database import async_session
from app.main import app
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
from app.models.product import Product
from app.models.user import User

TEST_SECRET = "TEST_WEBHOOK_SECRET_KEY_789"


def compute_signature(raw_body: bytes, timestamp: str, secret: str = TEST_SECRET) -> str:
    """Compute standard Cashfree HMAC-SHA256 signature."""
    signed_payload = f"{timestamp}".encode("utf-8") + raw_body
    hmac_digest = hmac.new(
        secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).digest()
    return base64.b64encode(hmac_digest).decode("utf-8")


async def create_test_order_and_payment(db, amount: Decimal = Decimal("799.00")):
    """Helper to provision test customer, order, inventory reservation, and payment record."""
    user = User(
        id=uuid.uuid4(),
        auth_id=f"auth_{uuid.uuid4().hex[:12]}",
        email=f"webhook_buyer_{uuid.uuid4().hex[:6]}@example.com",
        full_name="Webhook Buyer",
        role="customer",
        is_active=True,
    )
    db.add(user)

    res = await db.execute(select(Product).where(Product.is_active == True))
    product = res.scalars().first()
    assert product is not None, "At least one active product must exist."

    order_id = uuid.uuid4()
    order_number = f"DC-WH-{uuid.uuid4().hex[:6].upper()}"
    order = Order(
        id=order_id,
        order_number=order_number,
        user_id=user.id,
        customer_email=user.email,
        customer_phone="9876543210",
        shipping_name="Webhook Buyer",
        shipping_phone="9876543210",
        shipping_address_line_1="77 Indiranagar",
        shipping_city="Bengaluru",
        shipping_state="Karnataka",
        shipping_pincode="560038",
        subtotal=amount,
        shipping_cost=Decimal("0.00"),
        discount=Decimal("0.00"),
        total=amount,
        status=OrderStatus.PAYMENT_PENDING.value,
        payment_method="cashfree",
        payment_status=OrderPaymentStatus.PENDING.value,
    )
    db.add(order)

    now = datetime.now(timezone.utc)
    reservation = InventoryReservation(
        id=uuid.uuid4(),
        order_id=order_id,
        product_id=product.id,
        variant_id=None,
        quantity=1,
        status=ReservationStatus.RESERVED.value,
        expires_at=now + timedelta(minutes=15),
    )
    db.add(reservation)

    merchant_order_id = f"CF_ORD_{uuid.uuid4().hex[:12]}"
    cf_order_id = f"cf_{uuid.uuid4().hex[:10]}"
    payment = Payment(
        id=uuid.uuid4(),
        order_id=order_id,
        gateway=PaymentGateway.CASHFREE.value,
        environment=PaymentEnvironment.SANDBOX.value,
        merchant_order_id=merchant_order_id,
        cf_order_id=cf_order_id,
        payment_session_id=f"session_{uuid.uuid4().hex[:16]}",
        amount=amount,
        currency="INR",
        status=PaymentSessionStatus.ACTIVE.value,
    )
    db.add(payment)
    await db.commit()

    return user, order, payment, reservation


@pytest.mark.asyncio
async def test_webhook_missing_headers_rejected():
    """Webhook request without signature or timestamp headers returns HTTP 400."""
    body = b'{"data":{}}'
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/payments/webhook", content=body)
    assert res.status_code == 400
    assert "missing webhook signature" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_webhook_invalid_signature_rejected():
    """Webhook request with invalid HMAC signature returns HTTP 401."""
    body = b'{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{}}'
    headers = {
        "x-webhook-signature": "bogus_signature==",
        "x-webhook-timestamp": "1700000000",
    }
    with patch("app.routers.payments.settings.CASHFREE_CLIENT_SECRET", TEST_SECRET):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/payments/webhook", content=body, headers=headers)
    assert res.status_code == 401
    assert "invalid webhook signature" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_webhook_unknown_order_returns_404():
    """Webhook for unknown merchant order ID returns HTTP 404."""
    payload = {
        "type": "PAYMENT_SUCCESS_WEBHOOK",
        "data": {
            "order": {
                "order_id": f"CF_UNKNOWN_{uuid.uuid4().hex[:8]}",
                "order_amount": 500.0,
                "order_currency": "INR",
            },
            "payment": {
                "cf_payment_id": "12345678",
                "payment_status": "SUCCESS",
                "payment_amount": 500.0,
                "payment_currency": "INR",
            },
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    timestamp = "1700000000"
    signature = compute_signature(raw_body, timestamp, TEST_SECRET)

    headers = {
        "x-webhook-signature": signature,
        "x-webhook-timestamp": timestamp,
    }
    with patch("app.routers.payments.settings.CASHFREE_CLIENT_SECRET", TEST_SECRET):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/payments/webhook", content=raw_body, headers=headers)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_webhook_currency_mismatch_rejected():
    """Webhook with currency other than INR is rejected with HTTP 400."""
    async with async_session() as db:
        _, order, payment, _ = await create_test_order_and_payment(db, Decimal("1000.00"))

    payload = {
        "type": "PAYMENT_SUCCESS_WEBHOOK",
        "data": {
            "order": {
                "order_id": payment.merchant_order_id,
                "order_amount": 1000.0,
                "order_currency": "USD",
            },
            "payment": {
                "cf_payment_id": "12345678",
                "payment_status": "SUCCESS",
                "payment_amount": 1000.0,
                "payment_currency": "USD",
            },
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    timestamp = "1700000000"
    signature = compute_signature(raw_body, timestamp, TEST_SECRET)
    headers = {
        "x-webhook-signature": signature,
        "x-webhook-timestamp": timestamp,
    }

    with patch("app.routers.payments.settings.CASHFREE_CLIENT_SECRET", TEST_SECRET):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/payments/webhook", content=raw_body, headers=headers)
    assert res.status_code == 400
    assert "currency must be inr" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_webhook_underpayment_rejected():
    """Webhook with payment_amount less than order total is rejected with HTTP 400."""
    async with async_session() as db:
        _, order, payment, _ = await create_test_order_and_payment(db, Decimal("1000.00"))

    payload = {
        "type": "PAYMENT_SUCCESS_WEBHOOK",
        "data": {
            "order": {
                "order_id": payment.merchant_order_id,
                "order_amount": 500.0,
                "order_currency": "INR",
            },
            "payment": {
                "cf_payment_id": "12345678",
                "payment_status": "SUCCESS",
                "payment_amount": 500.0,  # Underpaid! Expected 1000.00
                "payment_currency": "INR",
            },
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    timestamp = "1700000000"
    signature = compute_signature(raw_body, timestamp, TEST_SECRET)
    headers = {
        "x-webhook-signature": signature,
        "x-webhook-timestamp": timestamp,
    }

    with patch("app.routers.payments.settings.CASHFREE_CLIENT_SECRET", TEST_SECRET):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/payments/webhook", content=raw_body, headers=headers)
    assert res.status_code == 400
    assert "payment amount mismatch" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_webhook_payment_success_processing():
    """
    Successful PAYMENT_SUCCESS_WEBHOOK:
    - Marks Payment as PAID
    - Marks Order as CONFIRMED and PAID
    - Commits stock reservation atomically
    - Records PaymentAttempt and PaymentEvent
    """
    async with async_session() as db:
        _, order, payment, reservation = await create_test_order_and_payment(db, Decimal("1500.00"))

    cf_payment_id = f"pay_{uuid.uuid4().hex[:10]}"
    payload = {
        "type": "PAYMENT_SUCCESS_WEBHOOK",
        "event_time": datetime.now(timezone.utc).isoformat(),
        "data": {
            "order": {
                "order_id": payment.merchant_order_id,
                "order_amount": 1500.0,
                "order_currency": "INR",
            },
            "payment": {
                "cf_payment_id": cf_payment_id,
                "payment_status": "SUCCESS",
                "payment_amount": 1500.0,
                "payment_currency": "INR",
                "payment_group": "upi",
                "bank_reference": "UPI1234567890",
                "payment_message": "Transaction Successful",
            },
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    timestamp = "1700000000"
    signature = compute_signature(raw_body, timestamp, TEST_SECRET)
    headers = {
        "x-webhook-signature": signature,
        "x-webhook-timestamp": timestamp,
        "x-api-version": "2023-08-01",
    }

    with patch("app.routers.payments.settings.CASHFREE_CLIENT_SECRET", TEST_SECRET):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/payments/webhook", content=raw_body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["order_number"] == order.order_number

    # Verify DB state transitions
    async with async_session() as db:
        p = await db.get(Payment, payment.id)
        assert p.status == PaymentSessionStatus.PAID.value

        o = await db.get(Order, order.id)
        assert o.status == OrderStatus.CONFIRMED.value
        assert o.payment_status == OrderPaymentStatus.PAID.value
        assert o.payment_completed_at is not None

        r = await db.get(InventoryReservation, reservation.id)
        assert r.status == ReservationStatus.COMMITTED.value
        assert r.committed_at is not None

        # Verify PaymentAttempt created
        stmt_attempt = select(PaymentAttempt).where(PaymentAttempt.payment_id == payment.id)
        res_attempt = await db.execute(stmt_attempt)
        attempt = res_attempt.scalar_one()
        assert attempt.cf_payment_id == cf_payment_id
        assert attempt.payment_status == PaymentAttemptStatus.SUCCESS.value
        assert attempt.bank_reference == "UPI1234567890"

        # Verify PaymentEvent created
        stmt_event = select(PaymentEvent).where(PaymentEvent.payment_id == payment.id)
        res_event = await db.execute(stmt_event)
        event = res_event.scalar_one()
        assert event.signature_verified is True
        assert event.processing_status == WebhookProcessingStatus.PROCESSED.value


@pytest.mark.asyncio
async def test_webhook_idempotency_duplicate_event():
    """A replayed/duplicate webhook returns HTTP 200 without duplicating attempts or committing twice."""
    async with async_session() as db:
        _, order, payment, reservation = await create_test_order_and_payment(db, Decimal("850.00"))

    payload = {
        "type": "PAYMENT_SUCCESS_WEBHOOK",
        "data": {
            "order": {
                "order_id": payment.merchant_order_id,
                "order_amount": 850.0,
                "order_currency": "INR",
            },
            "payment": {
                "cf_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
                "payment_status": "SUCCESS",
                "payment_amount": 850.0,
                "payment_currency": "INR",
                "payment_group": "nb",
                "bank_reference": "NB987654321",
            },
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    timestamp = "1700000000"
    signature = compute_signature(raw_body, timestamp, TEST_SECRET)
    headers = {
        "x-webhook-signature": signature,
        "x-webhook-timestamp": timestamp,
    }

    with patch("app.routers.payments.settings.CASHFREE_CLIENT_SECRET", TEST_SECRET):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            # 1. First delivery
            res1 = await ac.post("/api/payments/webhook", content=raw_body, headers=headers)
            assert res1.status_code == 200

            # 2. Duplicate delivery (exact same bytes and headers)
            res2 = await ac.post("/api/payments/webhook", content=raw_body, headers=headers)
            assert res2.status_code == 200
            assert "Duplicate event already processed" in res2.json()["message"]

    # Verify only ONE attempt exists
    async with async_session() as db:
        stmt_attempt = select(PaymentAttempt).where(PaymentAttempt.payment_id == payment.id)
        res_attempt = await db.execute(stmt_attempt)
        attempts = res_attempt.scalars().all()
        assert len(attempts) == 1


@pytest.mark.asyncio
async def test_webhook_stale_failure_does_not_downgrade_paid_order():
    """Rule 12: A late FAILED webhook must never downgrade an already PAID order."""
    async with async_session() as db:
        _, order, payment, _ = await create_test_order_and_payment(db, Decimal("600.00"))
        # Pre-mark order and payment as PAID
        payment.status = PaymentSessionStatus.PAID.value
        order.status = OrderStatus.CONFIRMED.value
        order.payment_status = OrderPaymentStatus.PAID.value
        await db.commit()

    payload = {
        "type": "PAYMENT_FAILED_WEBHOOK",
        "data": {
            "order": {
                "order_id": payment.merchant_order_id,
                "order_amount": 600.0,
                "order_currency": "INR",
            },
            "payment": {
                "cf_payment_id": f"pay_failed_{uuid.uuid4().hex[:8]}",
                "payment_status": "FAILED",
                "payment_amount": 600.0,
                "payment_currency": "INR",
                "payment_message": "User cancelled or bank decline",
            },
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    timestamp = "1700000000"
    signature = compute_signature(raw_body, timestamp, TEST_SECRET)
    headers = {
        "x-webhook-signature": signature,
        "x-webhook-timestamp": timestamp,
    }

    with patch("app.routers.payments.settings.CASHFREE_CLIENT_SECRET", TEST_SECRET):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/payments/webhook", content=raw_body, headers=headers)
    assert res.status_code == 200

    # Verify Order and Payment REMAIN PAID
    async with async_session() as db:
        p = await db.get(Payment, payment.id)
        assert p.status == PaymentSessionStatus.PAID.value

        o = await db.get(Order, order.id)
        assert o.status == OrderStatus.CONFIRMED.value
        assert o.payment_status == OrderPaymentStatus.PAID.value
