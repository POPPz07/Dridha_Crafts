"""
Dridha Crafts - Cashfree Payment Gateway Service
Client operations, order session creation, webhook verification, and method restriction.
"""

import base64
import hashlib
import hmac
import logging
from decimal import Decimal
from typing import Any, Optional

import httpx
from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


class CashfreeError(Exception):
    """Base exception for Cashfree operations."""

    def __init__(self, message: str, status_code: Optional[int] = None, response_body: Optional[dict] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class CashfreeClient:
    """
    Centralized HTTP client for Cashfree Payment Gateway (API Version 2023-08-01).
    Enforces server-side credentials and restricted payment methods (UPI & Net Banking).
    """

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.client_id = self.settings.CASHFREE_CLIENT_ID
        self.client_secret = self.settings.CASHFREE_CLIENT_SECRET
        self.environment = self.settings.CASHFREE_ENVIRONMENT
        self.api_version = self.settings.CASHFREE_API_VERSION
        self.base_url = self.settings.CASHFREE_BASE_URL
        self.allowed_payment_methods = self.settings.CASHFREE_PAYMENT_METHODS  # "upi,nb"
        self.timeout = 15.0

    def _get_headers(self, idempotency_key: Optional[str] = None) -> dict[str, str]:
        """Construct secure authorization and version headers."""
        headers = {
            "Content-Type": "application/json",
            "x-api-version": self.api_version,
            "x-client-id": self.client_id,
            "x-client-secret": self.client_secret,
        }
        if idempotency_key:
            headers["x-idempotency-key"] = idempotency_key
        return headers

    async def create_order(
        self,
        order_id: str,
        order_amount: Decimal,
        customer_id: str,
        customer_phone: str,
        customer_name: str,
        customer_email: str,
        return_url: Optional[str] = None,
        notify_url: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        order_expiry_time: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create a Cashfree order session with method restriction (UPI & Net Banking).

        Returns:
            dict containing cf_order_id, payment_session_id, order_status, etc.
        """
        if not self.client_id or not self.client_secret:
            raise CashfreeError("Cashfree credentials (CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET) not configured.")

        # Ensure order_amount has 2 decimal precision
        amount_float = float(round(order_amount, 2))

        payload: dict[str, Any] = {
            "order_id": order_id,
            "order_amount": amount_float,
            "order_currency": "INR",
            "customer_details": {
                "customer_id": customer_id,
                "customer_phone": customer_phone,
                "customer_name": customer_name,
                "customer_email": customer_email,
            },
            "order_meta": {
                "return_url": return_url or self.settings.CASHFREE_RETURN_URL,
                "notify_url": notify_url or self.settings.CASHFREE_NOTIFY_URL,
                "payment_methods": self.allowed_payment_methods,  # Restricted to "upi,nb"
            },
        }

        if order_expiry_time:
            payload["order_expiry_time"] = order_expiry_time

        url = f"{self.base_url}/orders"
        headers = self._get_headers(idempotency_key=idempotency_key)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=headers)
                data = response.json() if response.content else {}

                if response.status_code >= 400:
                    error_msg = data.get("message") or f"Cashfree Create Order failed with status {response.status_code}"
                    logger.error("Cashfree create order error: status=%d body=%s", response.status_code, data)
                    raise CashfreeError(error_msg, status_code=response.status_code, response_body=data)

                return data
        except httpx.RequestError as exc:
            logger.error("Network error communicating with Cashfree: %s", str(exc))
            raise CashfreeError(f"Network error communicating with Cashfree: {str(exc)}") from exc

    async def get_order(self, order_id: str) -> dict[str, Any]:
        """Fetch order details from Cashfree."""
        if not self.client_id or not self.client_secret:
            raise CashfreeError("Cashfree credentials not configured.")

        url = f"{self.base_url}/orders/{order_id}"
        headers = self._get_headers()

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=headers)
                data = response.json() if response.content else {}

                if response.status_code >= 400:
                    error_msg = data.get("message") or f"Cashfree Get Order failed with status {response.status_code}"
                    raise CashfreeError(error_msg, status_code=response.status_code, response_body=data)

                return data
        except httpx.RequestError as exc:
            logger.error("Network error fetching Cashfree order: %s", str(exc))
            raise CashfreeError(f"Network error fetching Cashfree order: {str(exc)}") from exc

    async def get_order_payments(self, order_id: str) -> list[dict[str, Any]]:
        """Fetch payment attempts for an order from Cashfree."""
        if not self.client_id or not self.client_secret:
            raise CashfreeError("Cashfree credentials not configured.")

        url = f"{self.base_url}/orders/{order_id}/payments"
        headers = self._get_headers()

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=headers)
                data = response.json() if response.content else []

                if response.status_code >= 400:
                    error_msg = data.get("message", "Failed to fetch order payments") if isinstance(data, dict) else "Failed"
                    raise CashfreeError(error_msg, status_code=response.status_code)

                return data if isinstance(data, list) else []
        except httpx.RequestError as exc:
            logger.error("Network error fetching Cashfree order payments: %s", str(exc))
            raise CashfreeError(f"Network error fetching order payments: {str(exc)}") from exc

    def verify_webhook_signature(
        self,
        raw_body: bytes,
        timestamp: str,
        signature: str,
    ) -> bool:
        """
        Verify incoming Cashfree webhook HMAC-SHA256 signature.

        Formula:
            Base64(HMAC_SHA256(timestamp + raw_body, client_secret))
        """
        if not signature or not timestamp or not self.client_secret:
            return False

        try:
            signed_payload = f"{timestamp}".encode("utf-8") + raw_body
            secret_key_bytes = self.client_secret.encode("utf-8")
            hmac_computed = hmac.new(
                secret_key_bytes, signed_payload, hashlib.sha256
            ).digest()
            computed_signature = base64.b64encode(hmac_computed).decode("utf-8")

            return hmac.compare_digest(computed_signature, signature)
        except Exception as exc:
            logger.error("Webhook signature verification error: %s", str(exc))
            return False

