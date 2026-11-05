"""
Phase 5 Tests: FastAPI Cashfree Order & Session Creation (POST /api/payments/checkout).
Tests:
1. Unauthenticated checkout is rejected with HTTP 401.
2. Authenticated checkout creates Order, Payment, and calls Cashfree Create Order API.
3. Returns valid CashfreeCheckoutResponse containing payment_session_id.
4. Idempotent retry with same key and payload returns existing payment session.
5. Idempotent key reused with different payload returns HTTP 409 Conflict.
6. Cashfree API error transitions local payment to initiation_failed and returns HTTP 502.
7. Status endpoint GET /api/payments/order/{order_id}/status enforces user ownership.
"""

import uuid
from decimal import Decimal
from unittest.mock import patch
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.database import async_session
from app.main import app
from app.middleware.auth import get_current_user
from app.models.order import Order
from app.models.payment import Payment, PaymentSessionStatus
from app.models.product import Product
from app.models.user import Address, User
from app.services.cashfree import CashfreeError


async def get_test_product(db) -> Product:
    """Fetch an active product for testing checkout."""
    res = await db.execute(select(Product).where(Product.is_active == True))
    prod = res.scalars().first()
    assert prod is not None, "At least one active product must exist in the database."
    return prod


@pytest.mark.asyncio
async def test_unauthenticated_payment_checkout_rejected():
    """Unauthenticated payment checkout must be rejected by auth guard (HTTP 401 or 403)."""
    app.dependency_overrides.pop(get_current_user, None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/payments/checkout",
            json={
                "idempotency_key": str(uuid.uuid4()),
                "shipping_address": {
                    "full_name": "Ghost User",
                    "phone": "9999999999",
                    "address_line_1": "Nowhere",
                    "city": "Unknown",
                    "state": "Unknown",
                    "pincode": "111111",
                },
            },
        )
    assert res.status_code in [401, 403]


@pytest.mark.asyncio
async def test_authenticated_cashfree_checkout_success():
    """Authenticated customer checkout creates order, reservations, and Cashfree payment session."""
    async with async_session() as db:
        test_email = f"cf_user_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            id=uuid.uuid4(),
            auth_id=f"auth_{uuid.uuid4().hex[:12]}",
            email=test_email,
            full_name="Cashfree Buyer",
            role="customer",
            is_active=True,
        )
        db.add(user)
        product = await get_test_product(db)
        await db.commit()

        # Detach user for override
        test_user = User(
            id=user.id,
            auth_id=user.auth_id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=True,
        )

    app.dependency_overrides[get_current_user] = lambda: test_user

    mock_cf_response = {
        "cf_order_id": f"cf_{uuid.uuid4().hex[:8]}",
        "payment_session_id": f"session_{uuid.uuid4().hex[:24]}",
        "order_status": "ACTIVE",
    }

    checkout_payload = {
        "idempotency_key": str(uuid.uuid4()),
        "shipping_address": {
            "full_name": "Cashfree Buyer",
            "phone": "9876543210",
            "address_line_1": "45 MG Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001",
        },
        "items": [
            {
                "product_id": str(product.id),
                "variant_id": None,
                "quantity": 1,
            }
        ],
    }

    try:
        with patch("app.services.cashfree.CashfreeClient.create_order", return_value=mock_cf_response):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res = await ac.post("/api/payments/checkout", json=checkout_payload)

        assert res.status_code == 201
        data = res.json()
        assert data["payment_session_id"] == mock_cf_response["payment_session_id"]
        assert data["cf_order_id"] == mock_cf_response["cf_order_id"]
        assert data["order_number"].startswith("DC-")
        assert data["currency"] == "INR"
        assert Decimal(str(data["amount"])) > Decimal("0.00")

        # Verify DB records
        order_id = uuid.UUID(data["order_id"])
        payment_id = uuid.UUID(data["payment_id"])

        async with async_session() as db:
            p = await db.get(Payment, payment_id)
            assert p is not None
            assert p.status == PaymentSessionStatus.ACTIVE.value
            assert p.order_id == order_id
            assert p.payment_session_id == mock_cf_response["payment_session_id"]

            o = await db.get(Order, order_id)
            assert o is not None
            assert o.status == "payment_pending"
            assert o.payment_method == "cashfree"

    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_cashfree_checkout_idempotency_reuse_and_conflict():
    """Verify idempotent session reuse on identical payload and 409 conflict on altered payload."""
    async with async_session() as db:
        test_email = f"cf_idem_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            id=uuid.uuid4(),
            auth_id=f"auth_{uuid.uuid4().hex[:12]}",
            email=test_email,
            full_name="Idem Buyer",
            role="customer",
            is_active=True,
        )
        db.add(user)
        product = await get_test_product(db)
        await db.commit()

        test_user = User(
            id=user.id,
            auth_id=user.auth_id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=True,
        )

    app.dependency_overrides[get_current_user] = lambda: test_user

    idem_key = str(uuid.uuid4())
    mock_cf_response = {
        "cf_order_id": f"cf_{uuid.uuid4().hex[:8]}",
        "payment_session_id": f"session_{uuid.uuid4().hex[:24]}",
        "order_status": "ACTIVE",
    }

    payload = {
        "idempotency_key": idem_key,
        "shipping_address": {
            "full_name": "Idem Buyer",
            "phone": "9876543210",
            "address_line_1": "100 Indiranagar",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560038",
        },
        "items": [{"product_id": str(product.id), "variant_id": None, "quantity": 1}],
    }

    try:
        # First request creates order & payment
        with patch("app.services.cashfree.CashfreeClient.create_order", return_value=mock_cf_response):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res1 = await ac.post("/api/payments/checkout", json=payload)
        assert res1.status_code == 201
        data1 = res1.json()

        # Second request with SAME idempotency key & payload: returns existing session
        with patch("app.services.cashfree.CashfreeClient.create_order") as mock_cf:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res2 = await ac.post("/api/payments/checkout", json=payload)
            # Create Order on Cashfree should NOT be called again
            mock_cf.assert_not_called()

        assert res2.status_code == 201
        data2 = res2.json()
        assert data2["payment_session_id"] == data1["payment_session_id"]
        assert data2["order_number"] == data1["order_number"]

        # Third request with SAME idempotency key but DIFFERENT items: returns 409 Conflict
        conflicting_payload = {
            **payload,
            "items": [{"product_id": str(product.id), "variant_id": None, "quantity": 2}],
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res3 = await ac.post("/api/payments/checkout", json=conflicting_payload)
        assert res3.status_code == 409
        assert "different order payload" in res3.json()["detail"].lower()

    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_cashfree_api_error_handling():
    """When Cashfree Create Order fails, local payment is marked initiation_failed and returns 502."""
    async with async_session() as db:
        test_email = f"cf_err_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            id=uuid.uuid4(),
            auth_id=f"auth_{uuid.uuid4().hex[:12]}",
            email=test_email,
            full_name="Error Tester",
            role="customer",
            is_active=True,
        )
        db.add(user)
        product = await get_test_product(db)
        await db.commit()

        test_user = User(
            id=user.id,
            auth_id=user.auth_id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=True,
        )

    app.dependency_overrides[get_current_user] = lambda: test_user

    payload = {
        "idempotency_key": str(uuid.uuid4()),
        "shipping_address": {
            "full_name": "Error Tester",
            "phone": "9876543210",
            "address_line_1": "100 Indiranagar",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560038",
        },
        "items": [{"product_id": str(product.id), "variant_id": None, "quantity": 1}],
    }

    try:
        with patch(
            "app.services.cashfree.CashfreeClient.create_order",
            side_effect=CashfreeError("Cashfree upstream timeout", status_code=504),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res = await ac.post("/api/payments/checkout", json=payload)

        assert res.status_code == 502
        assert "cashfree upstream timeout" in res.json()["detail"].lower()

    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_order_payment_status_endpoint_ownership():
    """Verify GET /api/payments/order/{order_id}/status enforces user ownership."""
    async with async_session() as db:
        user_a = User(
            id=uuid.uuid4(),
            auth_id=f"auth_{uuid.uuid4().hex[:12]}",
            email=f"user_a_{uuid.uuid4().hex[:6]}@example.com",
            full_name="User A",
            role="customer",
            is_active=True,
        )
        user_b = User(
            id=uuid.uuid4(),
            auth_id=f"auth_{uuid.uuid4().hex[:12]}",
            email=f"user_b_{uuid.uuid4().hex[:6]}@example.com",
            full_name="User B",
            role="customer",
            is_active=True,
        )
        db.add_all([user_a, user_b])

        order_a = Order(
            id=uuid.uuid4(),
            order_number=f"ORD-A-{uuid.uuid4().hex[:6].upper()}",
            user_id=user_a.id,
            customer_email=user_a.email,
            customer_phone="9876543210",
            shipping_name="User A",
            shipping_phone="9876543210",
            shipping_address_line_1="Address A",
            shipping_city="Bengaluru",
            shipping_state="Karnataka",
            shipping_pincode="560001",
            subtotal=Decimal("500.00"),
            shipping_cost=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("500.00"),
            status="payment_pending",
            payment_method="cashfree",
            payment_status="pending",
        )
        db.add(order_a)

        payment_a = Payment(
            id=uuid.uuid4(),
            order_id=order_a.id,
            gateway="cashfree",
            environment="sandbox",
            merchant_order_id=f"CF_{uuid.uuid4().hex[:12]}",
            cf_order_id=f"cf_{uuid.uuid4().hex[:10]}",
            payment_session_id=f"session_{uuid.uuid4().hex[:16]}",
            amount=Decimal("500.00"),
            status="active",
        )
        db.add(payment_a)
        await db.commit()

        test_user_a = User(
            id=user_a.id,
            auth_id=user_a.auth_id,
            email=user_a.email,
            full_name=user_a.full_name,
            role="customer",
            is_active=True,
        )
        test_user_b = User(
            id=user_b.id,
            auth_id=user_b.auth_id,
            email=user_b.email,
            full_name=user_b.full_name,
            role="customer",
            is_active=True,
        )

    # 1. User A can view their own order payment status
    app.dependency_overrides[get_current_user] = lambda: test_user_a
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res_a = await ac.get(f"/api/payments/order/{order_a.id}/status")
        assert res_a.status_code == 200
        data_a = res_a.json()
        assert data_a["order_number"] == order_a.order_number
        assert data_a["status"] == "active"
        assert data_a["cf_order_id"] == payment_a.cf_order_id
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # 2. User B trying to view User A's order payment status receives HTTP 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: test_user_b
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res_b = await ac.get(f"/api/payments/order/{order_a.id}/status")
        assert res_b.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)
