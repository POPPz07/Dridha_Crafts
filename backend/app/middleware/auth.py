"""
Dridha Crafts - Authentication Middleware
FastAPI dependencies for extracting and verifying the current user from Supabase JWTs.
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
        # Auto-create profile on first authenticated request
        user = User(
            auth_id=auth_id,
            email=email,
            full_name=email.split("@")[0],  # Fallback name
        )
        db.add(user)
        await db.flush()  # Populate id

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
    Dependency: same as get_current_user but also verifies admin role.

    Raises:
        HTTPException 403: If user is not an admin.
    """
    if user.role != "admin":
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
