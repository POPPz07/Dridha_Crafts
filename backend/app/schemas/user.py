"""
Dridha Crafts - User Schemas
Pydantic models for user registration, profile, and address operations.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── User Schemas ─────────────────────────────────────────────────────────────


class UserCreate(BaseModel):
    """Schema for new user registration."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=1, max_length=100, description="User's full name")


class UserResponse(BaseModel):
    """Public user profile response."""

    id: uuid.UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Schema for updating user profile. All fields optional."""

    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


# ── Address Schemas ──────────────────────────────────────────────────────────


class AddressCreate(BaseModel):
    """Schema for creating a shipping address."""

    full_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    address_line_1: str = Field(..., min_length=1, max_length=255)
    address_line_2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    pincode: str = Field(..., min_length=6, max_length=10, pattern=r"^\d{6}$")


class AddressResponse(BaseModel):
    """Address response with all fields."""

    id: uuid.UUID
    full_name: str
    phone: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    pincode: str
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AddressUpdate(BaseModel):
    """Schema for updating an address. All fields optional."""

    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    address_line_1: Optional[str] = Field(None, min_length=1, max_length=255)
    address_line_2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    pincode: Optional[str] = Field(None, min_length=6, max_length=10, pattern=r"^\d{6}$")
