"""
Dridha Crafts - Authentication Middleware
FastAPI dependencies for extracting and verifying the current user from Supabase JWTs.
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.utils.security import verify_supabase_token

# Bearer token extractor — auto_error=True raises 403 if header is missing
_bearer_scheme = HTTPBearer(auto_error=True)
_bearer_scheme_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency: extract Bearer token, verify with Supabase, and return the User row.

    If the user doesn't yet have a profile row in our DB (first request after
    Supabase signup from the frontend), a minimal profile is auto-created.

    Raises:
        HTTPException 401: Invalid or missing token.
        HTTPException 403: User account is deactivated.
    """
    payload = await verify_supabase_token(credentials.credentials)
    auth_id: str = payload["sub"]
    email: str = payload.get("email", "")

    # Fetch existing profile
    result = await db.execute(select(User).where(User.auth_id == auth_id))
    user = result.scalar_one_or_none()

    if user is None:
        # Check if the user genuinely exists in Supabase Auth before auto-provisioning
        settings = get_settings()
        is_valid_auth = False
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
                auth_user_resp = sb.auth.admin.get_user_by_id(auth_id)
                if auth_user_resp and getattr(auth_user_resp, "user", None):
                    is_valid_auth = True
            except Exception:
                is_valid_auth = False

        if not is_valid_auth:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account no longer exists or was removed.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Auto-create profile only for legitimate, verified Supabase accounts
        meta = {}
        phone_val = None
        if is_valid_auth and auth_user_resp and getattr(auth_user_resp, "user", None):
            sb_user = auth_user_resp.user
            meta = getattr(sb_user, "user_metadata", {}) or {}
            phone_val = meta.get("phone") or getattr(sb_user, "phone", None)

        full_name_val = meta.get("full_name") or email.split("@")[0]
        user = User(
            auth_id=auth_id,
            email=email,
            full_name=full_name_val,
            phone=phone_val,
        )
        db.add(user)
        await db.flush()  # Populate id
    elif not user.phone:
        # Sync phone from Supabase if not yet populated
        settings = get_settings()
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
                auth_user_resp = sb.auth.admin.get_user_by_id(auth_id)
                if auth_user_resp and getattr(auth_user_resp, "user", None):
                    sb_user = auth_user_resp.user
                    meta = getattr(sb_user, "user_metadata", {}) or {}
                    phone_val = meta.get("phone") or getattr(sb_user, "phone", None)
                    if phone_val:
                        user.phone = phone_val
                        await db.flush()
            except Exception:
                pass

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return user


async def get_current_admin(
    user: User = Depends(get_current_user),
) -> User:
    """
    Dependency: same as get_current_user but strictly enforces active admin account.

    Raises:
        HTTPException 403: If user is not an active admin.
    """
    if user.role != "admin" or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme_optional),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Dependency: returns the authenticated User if a valid Bearer token is present,
    or None if no token is provided. Useful for endpoints that behave differently
    for logged-in vs. anonymous users.
    """
    if credentials is None:
        return None

    try:
        payload = await verify_supabase_token(credentials.credentials)
    except HTTPException:
        return None

    auth_id: str = payload["sub"]
    result = await db.execute(select(User).where(User.auth_id == auth_id))
    user = result.scalar_one_or_none()
    return user
