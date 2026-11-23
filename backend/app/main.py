"""
Dridha Crafts - FastAPI Main Application
Entry point for the backend REST API.
"""

import asyncio
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.database import async_session, engine
from app.utils.limiter import limiter
from app.middleware.request_id import RequestIDMiddleware
from app.routers.orders import release_expired_reservations
from app.routers import (
    addresses,
    admin,
    auth,
    cart,
    orders,
    payments,
    products,
    reviews,
    wishlist,
)

logger = logging.getLogger("dridhacrafts")
logging.basicConfig(level=logging.INFO)

settings = get_settings()



async def reservation_expiry_worker():
    """
    Background worker that runs periodically (every 5 minutes)
    to reconcile and release expired inventory reservations.
    """
    while True:
        try:
            await asyncio.sleep(300)
            async with async_session() as session:
                released = await release_expired_reservations(session)
                if released > 0:
                    await session.commit()
                    logger.info("Reservation worker: released %d expired reservations.", released)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Error in reservation_expiry_worker: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events: startup and shutdown."""
    logger.info("Starting up Dridha Crafts API in %s mode...", settings.ENVIRONMENT)

    # Self-healing database verification (ensure tracking fields and indexes exist)
    try:
        from sqlalchemy import text
        statements = [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(100)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_status_note VARCHAR(500)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ",
            "CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC) WHERE user_id IS NOT NULL",
            "CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_products_active ON products(id, slug, category) WHERE is_active = TRUE",
            "CREATE INDEX IF NOT EXISTS idx_products_active_category ON products(category, created_at DESC) WHERE is_active = TRUE",
            "CREATE INDEX IF NOT EXISTS idx_reservations_active ON inventory_reservations(expires_at ASC) WHERE status = 'reserved'",
            "CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON reviews(product_id, created_at DESC)",
        ]
        async with engine.begin() as conn:
            for stmt in statements:
                await conn.execute(text(stmt))
            logger.info("Database schema and performance composite indexes verified.")
    except Exception as e:
        logger.warning("Database schema verification notice: %s", e)

    expiry_task = asyncio.create_task(reservation_expiry_worker())
    yield
    expiry_task.cancel()
    try:
        await expiry_task
    except asyncio.CancelledError:
        pass
    logger.info("Shutting down Dridha Crafts API...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Dridha Crafts — Handcrafted wooden desk accessories from Kashmir Valley.",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
)

# Request ID & Structured Access Logging Middleware (Outer layer for full cycle tracing)
app.add_middleware(RequestIDMiddleware)

# Attach rate limiter & ASGI middleware (Enforces global rate limits across all routes)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Trusted Host Middleware (Host header poisoning & cache poisoning defense)
allowed_hosts = ["localhost", "127.0.0.1", "*.localhost", "testserver"]
if settings.ENVIRONMENT == "production":
    allowed_hosts.extend(["dridhacrafts.com", "*.dridhacrafts.com", "*.onrender.com", "*.vercel.app"])
else:
    allowed_hosts.append("*")
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS Middleware (strict origin whitelist from settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)


# Security Headers Middleware (OWASP defensive headers)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Global Exception Handler for unexpected errors (Prevents sensitive internal stack traces from leaking)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error processing %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Health check
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Render/uptime monitoring."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# Include Routers under /api prefix
api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(products.router, prefix=api_prefix)
app.include_router(products.bundle_router, prefix=api_prefix)
app.include_router(products.category_router, prefix=api_prefix)
app.include_router(cart.router, prefix=api_prefix)
app.include_router(orders.router, prefix=api_prefix)
app.include_router(reviews.router, prefix=api_prefix)
app.include_router(wishlist.router, prefix=api_prefix)
app.include_router(addresses.router, prefix=api_prefix)
app.include_router(payments.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
