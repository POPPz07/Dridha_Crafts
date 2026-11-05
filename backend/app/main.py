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
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.database import async_session
from app.routers.orders import release_expired_reservations
from app.routers import (
    addresses,
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

# Rate limiting
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_GENERAL])


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
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware (strict origin whitelist from settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)


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
