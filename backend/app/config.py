"""
Dridha Crafts - Backend Configuration
Centralized settings using Pydantic Settings for type-safe environment variable management.
"""

import os
from functools import lru_cache
from pydantic import Field
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
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins (frontend URLs)",
    )
    RATE_LIMIT_AUTH: str = "5/minute"
    RATE_LIMIT_GENERAL: str = "60/minute"

    # ── Email (Resend) ───────────────────────────────────
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "orders@dridhacrafts.com"

    # ── Payment ──────────────────────────────────────────
    UPI_ID: str = "dridhacrafts@upi"
    GOOGLE_PAY_QR_URL: str = ""

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
