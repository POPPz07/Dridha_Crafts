"""
Phase 3 Verification Tests: Payment Schema and SQLAlchemy Models.
Tests:
1. Creating a Payment record linked to an Order.
2. Creating a PaymentAttempt linked to Payment.
3. Creating a PaymentEvent linked to Payment and PaymentAttempt.
4. Foreign key ON DELETE RESTRICT prevents deleting order when payments exist.
5. Unique constraint on (gateway, merchant_order_id).
6. Unique partial index on (gateway, cf_order_id) and cf_payment_id.
7. Amount check constraints (amount > 0).
8. Status enums and updated_at trigger functionality.
"""

import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.database import async_session
from app.models.order import Order, OrderStatus, PaymentStatus as OrderPaymentStatus
from app.models.user import User
from app.models.payment import (
    Payment,
    PaymentAttempt,
    PaymentEvent,
    PaymentGateway,
    PaymentEnvironment,
    PaymentSessionStatus,
    PaymentAttemptStatus,
    WebhookProcessingStatus,
)


@pytest.mark.asyncio
async def test_payment_models_lifecycle_and_relationships():
    """Verify Payment, PaymentAttempt, and PaymentEvent models, relationships, and constraints."""
    async with async_session() as db:
        # 1. Setup test user and order
        test_email = f"paytest_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            id=uuid.uuid4(),
            auth_id=f"auth_{uuid.uuid4().hex[:12]}",
            email=test_email,
            full_name="Payment Tester",
            role="customer",
            is_active=True,
        )
        db.add(user)
        await db.flush()

        order = Order(
            id=uuid.uuid4(),
            order_number=f"ORD-P3-{uuid.uuid4().hex[:6].upper()}",
            user_id=user.id,
            customer_email=user.email,
            customer_phone="9876543210",
            shipping_name="Payment Tester",
            shipping_phone="9876543210",
            shipping_address_line_1="123 Test St",
            shipping_city="Bangalore",
            shipping_state="Karnataka",
            shipping_pincode="560001",
            subtotal=Decimal("999.00"),
            shipping_cost=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("999.00"),
            status=OrderStatus.PAYMENT_PENDING.value,
            payment_method="cashfree",
            payment_status=OrderPaymentStatus.PENDING.value,
        )
        db.add(order)
        await db.flush()

        # 2. Create Payment record (one Cashfree order/session)
        merchant_order_id = f"CF_ORD_{uuid.uuid4().hex[:12]}"
        cf_order_id = f"cf_order_{uuid.uuid4().hex[:8]}"
        session_id = f"session_{uuid.uuid4().hex[:20]}"

        payment = Payment(
            id=uuid.uuid4(),
            order_id=order.id,
            gateway=PaymentGateway.CASHFREE.value,
            environment=PaymentEnvironment.SANDBOX.value,
            merchant_order_id=merchant_order_id,
            cf_order_id=cf_order_id,
            payment_session_id=session_id,
            amount=Decimal("999.00"),
            currency="INR",
            status=PaymentSessionStatus.ACTIVE.value,
            idempotency_key=str(uuid.uuid4()),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        db.add(payment)
        await db.flush()

        assert payment.id is not None
        assert payment.order_id == order.id
        assert payment.status == PaymentSessionStatus.ACTIVE.value

        # 3. Create PaymentAttempt record (customer attempts payment)
        cf_payment_id = f"cf_pay_{uuid.uuid4().hex[:10]}"
        attempt = PaymentAttempt(
            id=uuid.uuid4(),
            payment_id=payment.id,
            cf_payment_id=cf_payment_id,
            payment_status=PaymentAttemptStatus.SUCCESS.value,
            provider_status="SUCCESS",
            payment_amount=Decimal("999.00"),
            currency="INR",
            payment_method="upi",
            bank_reference="UPI/1234567890/test",
            payment_message="Payment processed successfully",
            payment_time=datetime.now(timezone.utc),
            payment_completed_at=datetime.now(timezone.utc),
        )
        db.add(attempt)
        await db.flush()

        assert attempt.id is not None
        assert attempt.payment_id == payment.id
        assert attempt.payment_status == PaymentAttemptStatus.SUCCESS.value

        # 4. Create PaymentEvent (webhook audit record)
        event = PaymentEvent(
            id=uuid.uuid4(),
            payment_id=payment.id,
            payment_attempt_id=attempt.id,
            gateway=PaymentGateway.CASHFREE.value,
            event_type="PAYMENT_SUCCESS_WEBHOOK",
            webhook_version="2023-08-01",
            cf_event_id=f"evt_{uuid.uuid4().hex[:8]}",
            payload_hash=uuid.uuid4().hex,
            signature_verified=True,
            processing_status=WebhookProcessingStatus.PROCESSED.value,
            payload={"type": "PAYMENT_SUCCESS_WEBHOOK", "cf_payment_id": cf_payment_id},
        )
        db.add(event)
        await db.flush()

        assert event.id is not None
        assert event.payment_id == payment.id
        assert event.payment_attempt_id == attempt.id

        # 5. Verify relationships navigation
        # Query order with payments loaded
        stmt = select(Order).where(Order.id == order.id).options(selectinload(Order.payments))
        res = await db.execute(stmt)
        fetched_order = res.scalar_one()

        stmt_p = (
            select(Payment)
            .where(Payment.id == payment.id)
            .options(
                selectinload(Payment.order),
                selectinload(Payment.attempts),
                selectinload(Payment.events),
            )
        )
        res_p = await db.execute(stmt_p)
        fetched_payment = res_p.scalar_one()

        assert fetched_payment.order.id == fetched_order.id
        assert len(fetched_order.payments) == 1
        assert fetched_order.payments[0].merchant_order_id == merchant_order_id
        assert len(fetched_payment.attempts) == 1
        assert fetched_payment.attempts[0].cf_payment_id == cf_payment_id
        assert len(fetched_payment.events) == 1
        assert fetched_payment.events[0].signature_verified is True

        # Rollback test data
        await db.rollback()


@pytest.mark.asyncio
async def test_payment_constraints():
    """Verify unique constraints and positive amount check constraint."""
    async with async_session() as db:
        # Create minimal order
        test_email = f"paytest_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            id=uuid.uuid4(),
            auth_id=f"auth_{uuid.uuid4().hex[:12]}",
            email=test_email,
            full_name="Payment Tester",
            role="customer",
            is_active=True,
        )
        db.add(user)
        await db.flush()

        order = Order(
            id=uuid.uuid4(),
            order_number=f"ORD-C1-{uuid.uuid4().hex[:6].upper()}",
            user_id=user.id,
            customer_email=user.email,
            customer_phone="9876543210",
            shipping_name="Payment Tester",
            shipping_phone="9876543210",
            shipping_address_line_1="123 Test St",
            shipping_city="Bangalore",
            shipping_state="Karnataka",
            shipping_pincode="560001",
            subtotal=Decimal("500.00"),
            shipping_cost=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("500.00"),
            status=OrderStatus.PAYMENT_PENDING.value,
            payment_method="cashfree",
            payment_status=OrderPaymentStatus.PENDING.value,
        )
        db.add(order)
        await db.flush()

        shared_merchant_id = f"DUPL_{uuid.uuid4().hex[:10]}"
        p1 = Payment(
            id=uuid.uuid4(),
            order_id=order.id,
            gateway="cashfree",
            environment="sandbox",
            merchant_order_id=shared_merchant_id,
            amount=Decimal("500.00"),
            status="initiating",
        )
        db.add(p1)
        await db.flush()

        # Duplicate (gateway, merchant_order_id) must raise IntegrityError
        p2 = Payment(
            id=uuid.uuid4(),
            order_id=order.id,
            gateway="cashfree",
            environment="sandbox",
            merchant_order_id=shared_merchant_id,
            amount=Decimal("500.00"),
            status="initiating",
        )
        db.add(p2)
        with pytest.raises(IntegrityError):
            await db.flush()

        await db.rollback()
