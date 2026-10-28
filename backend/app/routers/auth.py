"""
Dridha Crafts - Auth Router
Handles user registration, login, profile, and logout via Supabase Auth.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_supabase_client():
    """Create a Supabase client using service role key for admin operations."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def _get_supabase_anon_client():
    """Create a Supabase client using anon key for user-facing auth operations."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.

    1. Creates user in Supabase Auth.
    2. Creates a profile row in the local users table.

    Returns the created user profile.
    """
    settings = get_settings()
    supabase = _get_supabase_client()

    # Check if email already exists in our DB
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    # Create user in Supabase Auth
    try:
        auth_response = supabase.auth.admin.create_user(
            {
                "email": data.email,
                "password": data.password,
                "email_confirm": True,
                "user_metadata": {"full_name": data.full_name},
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create auth user: {exc}",
        )

    # Create profile in our database
    user = User(
        auth_id=auth_response.user.id,
        email=data.email,
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()

    return user


@router.post("/login")
async def login(
    email: str,
    password: str,
):
    """
    Authenticate a user via Supabase Auth.

    Returns access_token, refresh_token, and user metadata.
    """
    supabase = _get_supabase_anon_client()

    try:
        auth_response = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials: {exc}",
        )

    return {
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "token_type": "bearer",
        "expires_in": auth_response.session.expires_in,
        "user": {
            "id": auth_response.user.id,
            "email": auth_response.user.email,
        },
    }


@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated user's profile."""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the authenticated user's profile.

    Only provided (non-None) fields are updated.
    """
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.flush()
    return current_user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user),
):
    """
    Sign out the current user.

    Note: actual token invalidation is handled client-side / by Supabase.
    This endpoint exists for API completeness and server-side cleanup if needed.
    """
    # Supabase handles token invalidation on the client side.
    # No server-side action needed for JWT-based auth.
    return None
