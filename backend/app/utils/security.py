"""
Dridha Crafts - Security Utilities
Token verification for Supabase Auth and order number generation.
"""

import logging
import secrets
import string
from datetime import datetime, timezone

from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.config import get_settings

logger = logging.getLogger("dridhacrafts.security")


async def verify_supabase_token(token: str) -> dict:
    """
    Verify a JWT issued by Supabase Auth.

    Decodes and validates the token using the Supabase JWT secret.
    Returns the payload containing user info (sub, email, role, etc.).

    Args:
        token: The raw JWT string from the Authorization header.

    Returns:
        Decoded token payload as a dict.

    Raises:
        HTTPException 401: If the token is expired, malformed, or invalid.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        sub: str | None = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject claim",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError as exc:
        logger.warning("Supabase JWT validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def generate_order_number() -> str:
    """
    Generate a unique order number in the format DC-YYYYMMDD-XXXX.

    The suffix is a 4-character uppercase alphanumeric random string,
    providing ~1.6 million unique values per day.

    Returns:
        Order number string, e.g. "DC-20261027-A3K9".
    """
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = "".join(
        secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4)
    )
    return f"DC-{date_part}-{random_part}"
