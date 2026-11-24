"""
Dridha Crafts - Backend Configuration
Centralized settings using Pydantic Settings for type-safe environment variable management.
"""

import json
import os
from functools import lru_cache
from typing import Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

_env_file_path = os.path.join(os.path.dirname(__file__), "..", ".env")


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "Dridha Crafts API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")

    # ── Supabase ─────────────────────────────────────────
    SUPABASE_URL: str = Field(
        default="https://placeholder-project.supabase.co",
        description="Supabase project URL",
    )
    SUPABASE_ANON_KEY: str = Field(
        default="placeholder-anon-key",
        description="Supabase anon/public key",
    )
    SUPABASE_SERVICE_ROLE_KEY: str = Field(
        default="placeholder-service-role-key",
        description="Supabase service role key (server-only)",
    )
    SUPABASE_JWT_SECRET: str = Field(
        default="placeholder-jwt-secret-placeholder-min-32-chars",
        description="Supabase JWT secret for token verification",
    )
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:placeholder@localhost:5432/postgres",
        description="PostgreSQL connection string from Supabase",
    )

    # ── Security ─────────────────────────────────────────
    CORS_ORIGINS: list[str] | str = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3005",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3005",
            "https://dridhacrafts.co.in",
            "https://www.dridhacrafts.co.in",
            "https://dridhacrafts.vercel.app",
            "https://dridha-crafts-frontend.vercel.app",
        ],
        description="Allowed CORS origins (frontend URLs)",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        raise ValueError(v)
    RATE_LIMIT_AUTH: str = "5/minute"
    RATE_LIMIT_GENERAL: str = "60/minute"
    CRON_SECRET: str | None = Field(default=None, description="Secret token for triggering cron endpoints")

    # ── Email & Notifications ──────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "craftsdridha@gmail.com"
    SMTP_PASSWORD: str = ""  # 16-letter Google App Password
    ADMIN_NOTIFICATION_EMAIL: str = "craftsdridha@gmail.com"
    ADMIN_PHONE: str = "9767807889"
    WHATSAPP_NUMBER: str = "919767807889"
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "craftsdridha@gmail.com"

    # ── Payment ──────────────────────────────────────────
    UPI_ID: str = "dridhacrafts@upi"
    GOOGLE_PAY_QR_URL: str = ""

    # ── Cashfree Payment Gateway ──────────────────────────
    CASHFREE_CLIENT_ID: str = Field(default="", description="Cashfree App ID / Client ID")
    CASHFREE_CLIENT_SECRET: str = Field(default="", description="Cashfree Client Secret (server-only)")
    CASHFREE_ENVIRONMENT: str = Field(default="sandbox", pattern="^(sandbox|production)$")
    CASHFREE_API_VERSION: str = Field(default="2023-08-01", description="Pinned Cashfree API version")
    CASHFREE_PAYMENT_METHODS: str = Field(default="upi,nb", description="Restricted customer-facing payment methods (UPI & Net Banking)")
    CASHFREE_RETURN_URL: str = Field(
        default="https://www.dridhacrafts.co.in/checkout/payment-status?order_id={order_id}",
        description="Return URL after Cashfree checkout completion",
    )
    CASHFREE_NOTIFY_URL: str = Field(
        default="http://localhost:8000/api/payments/webhook",
        description="Server-to-server webhook notification URL",
    )

    @property
    def CASHFREE_BASE_URL(self) -> str:
        """Centralized base URL for Cashfree PG API endpoints."""
        if self.CASHFREE_ENVIRONMENT == "production":
            return "https://api.cashfree.com/pg"
        return "https://sandbox.cashfree.com/pg"

    # ── File Storage ─────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    PRODUCT_IMAGES_BUCKET: str = "product-images"

    model_config = {
        "env_file": _env_file_path,
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — loaded once, reused across requests."""
    return Settings()


settings = get_settings()
