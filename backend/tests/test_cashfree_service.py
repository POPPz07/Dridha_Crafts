"""
Phase 4 Tests: Cashfree Sandbox Configuration and Method Restriction.
Tests:
1. CashfreeClient header structure and pinned API version (2023-08-01).
2. Base URL selection (sandbox vs production).
3. Payment method restriction (order_meta.payment_methods = 'upi,nb').
4. Webhook HMAC-SHA256 signature verification with valid and tampered payloads.
5. Error handling when credentials are missing.
"""

import base64
import hashlib
import hmac
from decimal import Decimal
import pytest
from unittest.mock import patch, AsyncMock
from app.config import Settings
from app.services.cashfree import CashfreeClient, CashfreeError


@pytest.fixture
def mock_settings():
    return Settings(
        CASHFREE_CLIENT_ID="TEST_APP_ID_123",
        CASHFREE_CLIENT_SECRET="TEST_SECRET_KEY_456",
        CASHFREE_ENVIRONMENT="sandbox",
        CASHFREE_API_VERSION="2023-08-01",
        CASHFREE_PAYMENT_METHODS="upi,nb",
        CASHFREE_RETURN_URL="http://localhost:3000/checkout/payment-status?order_id={order_id}",
        CASHFREE_NOTIFY_URL="http://localhost:8000/api/payments/webhook",
    )


def test_cashfree_client_configuration(mock_settings):
    """Verify pinned API version, base URL, and headers."""
    client = CashfreeClient(settings=mock_settings)

    assert client.base_url == "https://sandbox.cashfree.com/pg"
    assert client.api_version == "2023-08-01"
    assert client.allowed_payment_methods == "upi,nb"

    headers = client._get_headers(idempotency_key="test-key-uuid")
    assert headers["x-api-version"] == "2023-08-01"
    assert headers["x-client-id"] == "TEST_APP_ID_123"
    assert headers["x-client-secret"] == "TEST_SECRET_KEY_456"
    assert headers["x-idempotency-key"] == "test-key-uuid"
    assert headers["Content-Type"] == "application/json"


def test_cashfree_production_base_url():
    """Verify production base URL selection."""
    prod_settings = Settings(
        CASHFREE_CLIENT_ID="PROD_APP_ID",
        CASHFREE_CLIENT_SECRET="PROD_SECRET",
        CASHFREE_ENVIRONMENT="production",
    )
    client = CashfreeClient(settings=prod_settings)
    assert client.base_url == "https://api.cashfree.com/pg"


@pytest.mark.asyncio
async def test_create_order_payload_method_restriction(mock_settings):
    """Verify that Create Order sends payment_methods='upi,nb' and rounded amount."""
    client = CashfreeClient(settings=mock_settings)

    captured_url = None
    captured_payload = None
    captured_headers = None

    async def mock_post(url, json=None, headers=None):
        nonlocal captured_url, captured_payload, captured_headers
        captured_url = url
        captured_payload = json
        captured_headers = headers

        class MockResponse:
            status_code = 200
            content = b'{"cf_order_id": "123456", "payment_session_id": "session_abc"}'

            def json(self):
                return {"cf_order_id": "123456", "payment_session_id": "session_abc"}

        return MockResponse()

    with patch("httpx.AsyncClient.post", side_effect=mock_post):
        res = await client.create_order(
            order_id="ORD-101",
            order_amount=Decimal("1299.50"),
            customer_id="cust-1",
            customer_phone="9876543210",
            customer_name="John Doe",
            customer_email="john@example.com",
            idempotency_key="idem-uuid-001",
        )

    assert res["cf_order_id"] == "123456"
    assert res["payment_session_id"] == "session_abc"

    assert captured_url == "https://sandbox.cashfree.com/pg/orders"
    assert captured_payload["order_id"] == "ORD-101"
    assert captured_payload["order_amount"] == 1299.50
    assert captured_payload["order_currency"] == "INR"
    assert captured_payload["order_meta"]["payment_methods"] == "upi,nb"  # Strict restriction
    assert captured_headers["x-idempotency-key"] == "idem-uuid-001"
    assert captured_headers["x-api-version"] == "2023-08-01"


def test_webhook_signature_verification(mock_settings):
    """Verify webhook signature validation: valid, tampered body, and tampered signature."""
    client = CashfreeClient(settings=mock_settings)

    raw_body = b'{"type":"PAYMENT_SUCCESS_WEBHOOK","order_id":"ORD-101","payment_status":"SUCCESS"}'
    timestamp = "1700000000"

    # Compute genuine signature
    signed_payload = f"{timestamp}".encode("utf-8") + raw_body
    hmac_digest = hmac.new(
        mock_settings.CASHFREE_CLIENT_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).digest()
    valid_signature = base64.b64encode(hmac_digest).decode("utf-8")

    # 1. Valid signature passes
    assert client.verify_webhook_signature(raw_body, timestamp, valid_signature) is True

    # 2. Tampered body fails
    tampered_body = b'{"type":"PAYMENT_SUCCESS_WEBHOOK","order_id":"ORD-101","payment_status":"FAILED"}'
    assert client.verify_webhook_signature(tampered_body, timestamp, valid_signature) is False

    # 3. Tampered timestamp fails
    assert client.verify_webhook_signature(raw_body, "1700000001", valid_signature) is False

    # 4. Tampered signature fails
    assert client.verify_webhook_signature(raw_body, timestamp, "invalid_signature==") is False


@pytest.mark.asyncio
async def test_missing_credentials_raises_error():
    """Verify that calling Cashfree without credentials fails safely."""
    empty_settings = Settings(
        CASHFREE_CLIENT_ID="",
        CASHFREE_CLIENT_SECRET="",
    )
    client = CashfreeClient(settings=empty_settings)

    with pytest.raises(CashfreeError, match="Cashfree credentials .* not configured"):
        await client.create_order(
            order_id="ORD-1",
            order_amount=Decimal("100"),
            customer_id="c1",
            customer_phone="123",
            customer_name="N",
            customer_email="e@test.com",
        )

