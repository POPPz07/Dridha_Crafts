"""
Targeted tests for Cashfree Pre-Implementation Readiness:
1. Unauthenticated checkout rejection
2. Address ownership isolation (User A cannot use User B's address)
3. Manual UPI UTR submission does not commit stock (keeps RESERVED, extends 24h)
4. Admin approval commits stock reservation
5. Manual verification expiry releases stock safely after deadline
6. Concurrent checkout idempotency (simultaneous requests with same key create only one order)
7. Same idempotency key reused with different payload returns HTTP 409 Conflict
8. Concurrent checkout last-unit oversell prevention (stock=1, 2 concurrent users)
9. Repeated reservation expiry does not restore inventory twice
10. Separation of financial refunds from physical stock restoration
"""

import asyncio
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient, ASGITransport
from starlette.requests import Request
from sqlalchemy import select
from app.main import app
from app.database import get_db, async_session
from app.models.order import (
    Order,
    OrderItem,
    OrderStatus,
    PaymentStatus,
    InventoryReservation,
    ReservationStatus,
)
from app.models.user import User, Address
from app.models.product import Product, ProductVariant
from app.middleware.auth import get_current_user, get_current_admin
from app.routers.orders import release_expired_reservations


async def get_or_create_test_user(db, email: str, role: str = "customer") -> User:
    """Helper to ensure a persistent test user exists in the test DB and return a transient, unexpired instance."""
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalars().first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            auth_id=f"auth_{uuid.uuid4().hex[:12]}",
            email=email,
            full_name=f"Test {email.split('@')[0]}",
            role=role,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return User(
        id=user.id,
        auth_id=user.auth_id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
    )


# =====================================================================
# TEST 1: Unauthenticated checkout rejection
# =====================================================================
@pytest.mark.asyncio
async def test_unauthenticated_checkout_rejected():
    """Verify that unauthenticated checkout requests without a valid Bearer token are rejected with 401/403."""
    app.dependency_overrides.pop(get_current_user, None)

    async with async_session() as db:
        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 1))
        product = prod_res.scalars().first()
        assert product is not None

        payload = {
            "shipping_address": {
                "full_name": "Unauthenticated Hacker",
                "phone": "9876543210",
                "address_line_1": "123 Dark Web Lane",
                "city": "Srinagar",
                "state": "Jammu and Kashmir",
                "pincode": "190001",
            },
            "payment_method": "cod",
            "items": [{"product_id": str(product.id), "quantity": 1}],
        }

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/orders", json=payload)
            # FastAPI HTTPBearer returns 403 when header is missing; verify authentication barrier
            assert res.status_code in [401, 403], f"Expected 401/403, got {res.status_code}: {res.text}"


# =====================================================================
# TEST 2: Address ownership isolation
# =====================================================================
@pytest.mark.asyncio
async def test_address_ownership_isolation():
    """Verify that User A cannot place an order using User B's saved address_id."""
    async with async_session() as db:
        user_a = await get_or_create_test_user(db, "user_a@dridhacrafts.com")
        user_b = await get_or_create_test_user(db, "user_b@dridhacrafts.com")

        # Create an address belonging to User B
        address_b = Address(
            id=uuid.uuid4(),
            user_id=user_b.id,
            full_name="User B Recipient",
            phone="9111222333",
            address_line_1="User B House",
            city="Srinagar",
            state="Jammu and Kashmir",
            pincode="190005",
        )
        db.add(address_b)
        await db.commit()

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 1))
        product = prod_res.scalars().first()

        # Override auth as User A
        app.dependency_overrides[get_current_user] = lambda: user_a

        try:
            payload = {
                "address_id": str(address_b.id),
                "payment_method": "cod",
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res = await ac.post("/api/orders", json=payload)
                # User A cannot use User B's address
                assert res.status_code == 404, f"Expected 404, got {res.status_code}: {res.text}"
                assert "Shipping address not found" in res.json()["detail"]
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            # Cleanup address
            b_addr = await db.get(Address, address_b.id)
            if b_addr:
                await db.delete(b_addr)
                await db.commit()


# =====================================================================
# TEST 3: Manual UPI UTR submission does not commit stock
# =====================================================================
@pytest.mark.asyncio
async def test_manual_upi_utr_submission_does_not_commit_stock():
    """Verify customer UTR submission keeps reservation in RESERVED status and extends expires_at by 24h."""
    async with async_session() as db:
        test_user = await get_or_create_test_user(db, "upi_tester@dridhacrafts.com")
        app.dependency_overrides[get_current_user] = lambda: test_user

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 5))
        product = prod_res.scalars().first()
        initial_stock = product.stock_quantity

        order_id = None
        try:
            payload = {
                "shipping_address": {
                    "full_name": "UPI Customer",
                    "phone": "9876543210",
                    "address_line_1": "123 Craft Blvd",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190001",
                },
                "payment_method": "online",
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                # 1. Create order
                create_res = await ac.post("/api/orders", json=payload)
                assert create_res.status_code == 201
                order_data = create_res.json()
                order_id = uuid.UUID(order_data["id"])

                # Check initial reservation status
                db.expire_all()
                res_q = await db.execute(select(InventoryReservation).where(InventoryReservation.order_id == order_id))
                reservation = res_q.scalars().first()
                assert reservation.status == ReservationStatus.RESERVED.value

                # 2. Customer submits UTR number
                confirm_res = await ac.put(
                    f"/api/orders/{order_id}/confirm-payment",
                    json={"utr_number": "UTR998877665544"},
                )
                assert confirm_res.status_code == 200
                confirmed_data = confirm_res.json()
                assert confirmed_data["status"] == OrderStatus.PAYMENT_VERIFICATION.value
                assert confirmed_data["payment_status"] == PaymentStatus.MANUAL_VERIFICATION.value

                # 3. Assert reservation is NOT committed; remains RESERVED
                await db.refresh(reservation)
                assert reservation.status == ReservationStatus.RESERVED.value

                # 4. Assert reservation expiry was extended into the future by ~24 hours
                now_utc = datetime.now(timezone.utc)
                assert reservation.expires_at > now_utc + timedelta(hours=23)
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            if order_id:
                order = await db.get(Order, order_id)
                if order:
                    product.stock_quantity = initial_stock
                    await db.delete(order)
                    await db.commit()


# =====================================================================
# TEST 4: Admin approval commits stock
# =====================================================================
@pytest.mark.asyncio
async def test_admin_approval_commits_stock():
    """Verify that an admin approving an order transitions reservation to COMMITTED."""
    async with async_session() as db:
        admin_user = await get_or_create_test_user(db, "admin_approver@dridhacrafts.com", role="admin")
        customer_user = await get_or_create_test_user(db, "upi_customer@dridhacrafts.com")

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 5))
        product = prod_res.scalars().first()
        initial_stock = product.stock_quantity

        order_id = None
        try:
            # Customer creates order
            app.dependency_overrides[get_current_user] = lambda: customer_user
            payload = {
                "shipping_address": {
                    "full_name": "UPI Customer",
                    "phone": "9876543210",
                    "address_line_1": "123 Craft Blvd",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190001",
                },
                "payment_method": "online",
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                create_res = await ac.post("/api/orders", json=payload)
                assert create_res.status_code == 201
                order_id = uuid.UUID(create_res.json()["id"])

                # Customer submits UTR
                await ac.put(f"/api/orders/{order_id}/confirm-payment", json={"utr_number": "UTR123456789012"})

                # Now admin approves the payment
                app.dependency_overrides[get_current_user] = lambda: admin_user
                app.dependency_overrides[get_current_admin] = lambda: admin_user

                status_res = await ac.put(
                    f"/api/orders/{order_id}/status",
                    json={"status": "confirmed"},
                )
                assert status_res.status_code == 200
                data = status_res.json()
                assert data["status"] == OrderStatus.CONFIRMED.value
                assert data["payment_status"] == PaymentStatus.CONFIRMED.value

                # Verify reservation transitioned to COMMITTED
                db.expire_all()
                res_q = await db.execute(select(InventoryReservation).where(InventoryReservation.order_id == order_id))
                reservation = res_q.scalars().first()
                assert reservation.status == ReservationStatus.COMMITTED.value
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_admin, None)
            if order_id:
                order = await db.get(Order, order_id)
                if order:
                    product.stock_quantity = initial_stock
                    await db.delete(order)
                    await db.commit()


# =====================================================================
# TEST 5: Manual verification expiry releases stock safely after deadline
# =====================================================================
@pytest.mark.asyncio
async def test_manual_verification_expiry_releases_stock():
    """Verify that if manual verification window expires without approval, stock is restored and order is cancelled."""
    async with async_session() as db:
        customer_user = await get_or_create_test_user(db, "upi_expiry@dridhacrafts.com")
        app.dependency_overrides[get_current_user] = lambda: customer_user

        # Clear any prior expired reservations and commit
        await release_expired_reservations(db)
        await db.commit()

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 5))
        product = prod_res.scalars().first()
        await db.refresh(product)
        initial_stock = product.stock_quantity

        order_id = None
        try:
            payload = {
                "shipping_address": {
                    "full_name": "UPI Customer",
                    "phone": "9876543210",
                    "address_line_1": "123 Expiry Rd",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190001",
                },
                "payment_method": "online",
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                create_res = await ac.post("/api/orders", json=payload)
                assert create_res.status_code == 201
                order_id = uuid.UUID(create_res.json()["id"])

                # Verify stock was decremented by 1
                await db.refresh(product)
                stock_after_order = product.stock_quantity
                assert stock_after_order == initial_stock - 1

                # Submit UTR
                await ac.put(f"/api/orders/{order_id}/confirm-payment", json={"utr_number": "UTR_UNVERIFIED"})

                # Backdate expiration to the past
                res_q = await db.execute(select(InventoryReservation).where(InventoryReservation.order_id == order_id))
                reservation = res_q.scalars().first()
                reservation.expires_at = datetime.now(timezone.utc) - timedelta(hours=2)

                order = await db.get(Order, order_id)
                order.expires_at = datetime.now(timezone.utc) - timedelta(hours=2)
                await db.commit()

                # Trigger expiry reconciliation
                released = await release_expired_reservations(db)
                assert released >= 1
                await db.commit()

                # Verify stock restored and order cancelled
                await db.refresh(product)
                assert product.stock_quantity == stock_after_order + 1

                await db.refresh(reservation)
                assert reservation.status == ReservationStatus.RELEASED.value

                await db.refresh(order)
                assert order.status == OrderStatus.CANCELLED.value
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            if order_id:
                order = await db.get(Order, order_id)
                if order:
                    await db.delete(order)
                    await db.commit()


# =====================================================================
# TEST 6: Concurrent checkout idempotency
# =====================================================================
@pytest.mark.asyncio
async def test_concurrent_checkout_idempotency():
    """Verify that two simultaneous requests with the exact same idempotency key create only one order."""
    async with async_session() as db:
        customer_user = await get_or_create_test_user(db, "concurrent_buyer@dridhacrafts.com")
        app.dependency_overrides[get_current_user] = lambda: customer_user

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 5))
        product = prod_res.scalars().first()
        initial_stock = product.stock_quantity
        idem_key = f"concurrent_{uuid.uuid4().hex[:12]}"

        order_id = None
        try:
            payload = {
                "shipping_address": {
                    "full_name": "Concurrent Buyer",
                    "phone": "9876543210",
                    "address_line_1": "100 Fast Lane",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190001",
                },
                "payment_method": "cod",
                "idempotency_key": idem_key,
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                # Fire two requests concurrently
                res1, res2 = await asyncio.gather(
                    ac.post("/api/orders", json=payload),
                    ac.post("/api/orders", json=payload),
                )

                assert res1.status_code in [200, 201]
                assert res2.status_code in [200, 201]

                order1 = res1.json()
                order2 = res2.json()

                # Both calls must yield the identical order
                assert order1["id"] == order2["id"]
                assert order1["order_number"] == order2["order_number"]
                order_id = uuid.UUID(order1["id"])

                # Stock must be decremented ONLY ONCE
                await db.refresh(product)
                assert product.stock_quantity == initial_stock - 1
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            if order_id:
                order = await db.get(Order, order_id)
                if order:
                    product.stock_quantity = initial_stock
                    await db.delete(order)
                    await db.commit()


# =====================================================================
# TEST 7: Idempotency key reused with different payload returns 409
# =====================================================================
@pytest.mark.asyncio
async def test_idempotency_key_reused_with_different_payload():
    """Verify that reusing the same idempotency key with a altered payload returns HTTP 409 Conflict."""
    async with async_session() as db:
        customer_user = await get_or_create_test_user(db, "mismatch_idem@dridhacrafts.com")
        app.dependency_overrides[get_current_user] = lambda: customer_user

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 5))
        product = prod_res.scalars().first()
        initial_stock = product.stock_quantity
        shared_key = f"mismatch_{uuid.uuid4().hex[:12]}"

        order_id = None
        try:
            payload_a = {
                "shipping_address": {
                    "full_name": "First Address",
                    "phone": "9876543210",
                    "address_line_1": "123 Initial St",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190001",
                },
                "payment_method": "cod",
                "idempotency_key": shared_key,
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            payload_b = {
                "shipping_address": {
                    "full_name": "Completely Different Address",
                    "phone": "9999999999",
                    "address_line_1": "999 Altered Rd",
                    "city": "Jammu",
                    "state": "Jammu and Kashmir",
                    "pincode": "180001",
                },
                "payment_method": "cod",
                "idempotency_key": shared_key,
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res1 = await ac.post("/api/orders", json=payload_a)
                assert res1.status_code == 201
                order_id = uuid.UUID(res1.json()["id"])

                # Second request with identical key but different body
                res2 = await ac.post("/api/orders", json=payload_b)
                assert res2.status_code == 409
                assert "different" in res2.json()["detail"].lower()
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            if order_id:
                order = await db.get(Order, order_id)
                if order:
                    product.stock_quantity = initial_stock
                    await db.delete(order)
                    await db.commit()


# =====================================================================
# TEST 8: Concurrent checkout last-unit oversell prevention
# =====================================================================
@pytest.mark.asyncio
async def test_concurrent_checkout_last_unit_oversell_prevention():
    """Verify that when 2 distinct users try to buy the last available unit (stock=1), only 1 succeeds."""
    async with async_session() as db:
        user_1 = await get_or_create_test_user(db, "oversell_user1@dridhacrafts.com")
        user_2 = await get_or_create_test_user(db, "oversell_user2@dridhacrafts.com")

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 1))
        product = prod_res.scalars().first()
        initial_stock = product.stock_quantity

        # Temporarily set stock to 1
        product.stock_quantity = 1
        await db.commit()

        created_order_ids = []

        async def dynamic_user_dep(request: Request):
            header = request.headers.get("x-user")
            return user_2 if header == "user_2" else user_1

        app.dependency_overrides[get_current_user] = dynamic_user_dep

        try:
            payload_1 = {
                "shipping_address": {
                    "full_name": "User One",
                    "phone": "9876543210",
                    "address_line_1": "1 Unit St",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190001",
                },
                "payment_method": "cod",
                "idempotency_key": f"lastunit_{uuid.uuid4().hex[:8]}",
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            payload_2 = {
                "shipping_address": {
                    "full_name": "User Two",
                    "phone": "9876543211",
                    "address_line_1": "2 Unit St",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190001",
                },
                "payment_method": "cod",
                "idempotency_key": f"lastunit_{uuid.uuid4().hex[:8]}",
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res1, res2 = await asyncio.gather(
                    ac.post("/api/orders", json=payload_1, headers={"x-user": "user_1"}),
                    ac.post("/api/orders", json=payload_2, headers={"x-user": "user_2"}),
                )

                statuses = [res1.status_code, res2.status_code]
                # Exactly one must succeed (201) and the other must fail (400 insufficient stock)
                assert 201 in statuses, f"At least one must succeed: {statuses}"
                assert 400 in statuses, f"Second must fail with 400: {statuses}"

                for r in (res1, res2):
                    if r.status_code == 201:
                        created_order_ids.append(uuid.UUID(r.json()["id"]))

                # Stock must be exactly 0, NEVER negative
                await db.refresh(product)
                assert product.stock_quantity == 0
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            product.stock_quantity = initial_stock
            for oid in created_order_ids:
                ord_rec = await db.get(Order, oid)
                if ord_rec:
                    await db.delete(ord_rec)
            await db.commit()


# =====================================================================
# TEST 9: Repeated reservation expiry does not double restore inventory
# =====================================================================
@pytest.mark.asyncio
async def test_repeated_reservation_expiry_does_not_double_restore():
    """Verify that calling reservation expiry reconciliation repeatedly on expired orders restores stock only once."""
    async with async_session() as db:
        customer_user = await get_or_create_test_user(db, "double_restore@dridhacrafts.com")
        app.dependency_overrides[get_current_user] = lambda: customer_user

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 5))
        product = prod_res.scalars().first()
        initial_stock = product.stock_quantity

        order_id = None
        try:
            payload = {
                "shipping_address": {
                    "full_name": "Repeat Customer",
                    "phone": "9876543210",
                    "address_line_1": "123 Repeat Rd",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190001",
                },
                "payment_method": "online",
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                create_res = await ac.post("/api/orders", json=payload)
                assert create_res.status_code == 201
                order_id = uuid.UUID(create_res.json()["id"])

                # Stock is initially decremented by 1
                await db.refresh(product)
                assert product.stock_quantity == initial_stock - 1

                # Backdate expiration
                res_q = await db.execute(select(InventoryReservation).where(InventoryReservation.order_id == order_id))
                reservation = res_q.scalars().first()
                reservation.expires_at = datetime.now(timezone.utc) - timedelta(minutes=30)
                await db.commit()

                # First expiry run restores stock
                count1 = await release_expired_reservations(db)
                assert count1 >= 1

                await db.refresh(product)
                assert product.stock_quantity == initial_stock

                # Second expiry run must NOT restore stock again
                count2 = await release_expired_reservations(db)
                assert count2 == 0

                await db.refresh(product)
                assert product.stock_quantity == initial_stock
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            if order_id:
                order = await db.get(Order, order_id)
                if order:
                    await db.delete(order)
                    await db.commit()


# =====================================================================
# TEST 10: Separation of financial refunds from physical stock restoration
# =====================================================================
@pytest.mark.asyncio
async def test_separate_refund_from_physical_stock_restoration():
    """Verify that financial refund does NOT restore stock unless restore_stock=True is explicitly passed."""
    async with async_session() as db:
        admin_user = await get_or_create_test_user(db, "admin_refunder@dridhacrafts.com", role="admin")
        customer_user = await get_or_create_test_user(db, "refund_customer@dridhacrafts.com")

        app.dependency_overrides[get_current_user] = lambda: customer_user
        app.dependency_overrides[get_current_admin] = lambda: admin_user

        prod_res = await db.execute(select(Product).where(Product.is_active == True, Product.stock_quantity >= 5))
        product = prod_res.scalars().first()
        initial_stock = product.stock_quantity

        order_id = None
        try:
            payload = {
                "shipping_address": {
                    "full_name": "Refund Test",
                    "phone": "9876543210",
                    "address_line_1": "789 Pine Road",
                    "city": "Srinagar",
                    "state": "Jammu and Kashmir",
                    "pincode": "190003",
                },
                "payment_method": "cod",
                "items": [{"product_id": str(product.id), "quantity": 1}],
            }

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res = await ac.post("/api/orders", json=payload)
                assert res.status_code == 201
                order_id = uuid.UUID(res.json()["id"])

                # Stock is decremented by 1
                await db.refresh(product)
                assert product.stock_quantity == initial_stock - 1

                # Admin issues a financial REFUND without physical stock restoration
                refund_res = await ac.put(
                    f"/api/orders/{order_id}/status",
                    json={"status": "refunded", "restore_stock": False},
                )
                assert refund_res.status_code == 200

                # Stock must NOT be restored
                await db.refresh(product)
                assert product.stock_quantity == initial_stock - 1

                # Admin explicitly marks physical return with restore_stock=True
                restore_res = await ac.put(
                    f"/api/orders/{order_id}/status",
                    json={"status": "refunded", "restore_stock": True},
                )
                assert restore_res.status_code == 200

                # Now stock IS restored
                await db.refresh(product)
                assert product.stock_quantity == initial_stock
        finally:
            app.dependency_overrides.pop(get_current_user, None)
            app.dependency_overrides.pop(get_current_admin, None)
            if order_id:
                order = await db.get(Order, order_id)
                if order:
                    await db.delete(order)
                    await db.commit()
