"""
Dridha Crafts - Security Utilities
Token verification for Supabase Auth and order number generation.
"""

import logging
import secrets
import string
from datetime import datetime, timezone

import jwt
from fastapi import HTTPException, status
from supabase import create_client

from app.config import get_settings

logger = logging.getLogger(__name__)

_jwks_client: jwt.PyJWKClient | None = None
_supabase_client = None


def get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        settings = get_settings()
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = jwt.PyJWKClient(jwks_url, cache_keys=True, max_cached_keys=16)
    return _jwks_client


def get_supabase_client():
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    return _supabase_client


async def verify_supabase_token(token: str) -> dict:
    """
    Verify a JWT issued by Supabase Auth with cryptographic and issuer validation.

    Supports:
    - ES256 / RS256 asymmetric signatures via Supabase Auth JWKS endpoint (default in modern Supabase).
    - HS256 symmetric signature using SUPABASE_JWT_SECRET.
    - Fallback verification using Supabase Auth API get_user.

    Args:
        token: The raw JWT string from the Authorization header.

    Returns:
        Decoded token payload as a dict.

    Raises:
        HTTPException 401: If the token is missing, expired, malformed, or invalid.
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or empty authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = token.strip()
    settings = get_settings()
    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

    # 1. Determine algorithm from unverified header (strict whitelist)
    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        if alg not in ["ES256", "RS256", "HS256"]:
            logger.warning("Rejected token with disallowed algorithm: %s", alg)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Disallowed signature algorithm",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        raise
    except Exception:
        alg = "ES256"

    # 2. Asymmetric token verification (ES256 / RS256)
    if alg in ["ES256", "RS256"]:
        try:
            jwks = get_jwks_client()
            signing_key = jwks.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
                leeway=120,
            )
            # Validate issuer if present
            token_iss = payload.get("iss", "").rstrip("/")
            if token_iss and token_iss != expected_issuer:
                logger.warning("Token issuer mismatch: got %s, expected %s", token_iss, expected_issuer)
                raise jwt.InvalidIssuerError("Invalid token issuer")
            if payload.get("sub"):
                return payload
        except Exception as e:
            logger.warning("JWKS token decode failed, falling back: %s", e)

    # 3. Symmetric token verification (HS256)
    if alg == "HS256" and settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                leeway=120,
            )
            # Validate issuer if present
            token_iss = payload.get("iss", "").rstrip("/")
            if token_iss and token_iss != expected_issuer:
                logger.warning("Token issuer mismatch: got %s, expected %s", token_iss, expected_issuer)
                raise jwt.InvalidIssuerError("Invalid token issuer")
            if payload.get("sub"):
                return payload
        except Exception as e:
            logger.warning("HS256 token decode failed: %s", e)

    # 4. Fallback verification via Supabase Auth API
    try:
        sb = get_supabase_client()
        user_resp = sb.auth.get_user(token)
        if user_resp and user_resp.user:
            u = user_resp.user
            return {
                "sub": u.id,
                "email": u.email,
                "role": u.app_metadata.get("role", "customer"),
                "app_metadata": u.app_metadata,
                "user_metadata": u.user_metadata,
            }
    except Exception as e:
        logger.error("Supabase get_user fallback failed: %s", e)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials: Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def generate_order_number() -> str:
    """
    Generate a unique order number in the format DC-YYYYMMDD-XXXX.

    The suffix is a 6-character uppercase alphanumeric random string.

    Returns:
        Order number string, e.g. "DC-20261027-A3K9X2".
    """
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = "".join(
        secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
    )
    return f"DC-{date_part}-{random_part}"
