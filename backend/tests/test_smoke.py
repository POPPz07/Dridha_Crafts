"""Smoke test to verify that the FastAPI backend boots up and routes are registered."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify health endpoint returns 200 and expected status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "Dridha Crafts API"


def test_routes_registered():
    """Verify all required routers are registered."""
    routes = [r.path for r in app.routes if hasattr(r, "path")]
    expected_prefixes = [
        "/health",
        "/api/auth",
        "/api/products",
        "/api/bundles",
        "/api/categories",
        "/api/cart",
        "/api/orders",
        "/api/reviews",
        "/api/wishlist",
        "/api/addresses",
    ]
    for prefix in expected_prefixes:
        assert any(r.startswith(prefix) for r in routes), f"Missing route prefix: {prefix}"
