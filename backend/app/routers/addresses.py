"""
Dridha Crafts - Addresses Router
CRUD endpoints for user shipping addresses.
"""

import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import Address, User
from app.schemas.user import AddressCreate, AddressResponse, AddressUpdate

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("", response_model=list[AddressResponse])
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all shipping addresses for the current user."""
    result = await db.execute(
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a new shipping address.

    If this is the user's first address, it is automatically set as default.
    """
    # Check if user has any existing addresses
    count_result = await db.execute(
        select(Address.id).where(Address.user_id == current_user.id).limit(1)
    )
    is_first = count_result.scalar_one_or_none() is None

    address = Address(
        user_id=current_user.id,
        full_name=data.full_name,
        phone=data.phone,
        address_line_1=data.address_line_1,
        address_line_2=data.address_line_2,
        city=data.city,
        state=data.state,
        pincode=data.pincode,
        is_default=is_first,
    )
    db.add(address)
    await db.flush()
    return address


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: _uuid.UUID,
    data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing address. Only the owner can update it."""
    result = await db.execute(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == current_user.id,
        )
    )
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    for field, value in update_data.items():
        setattr(address, field, value)

    await db.flush()
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: _uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an address. Cannot delete the default address if others exist."""
    result = await db.execute(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == current_user.id,
        )
    )
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    if address.is_default:
        # Check if there are other addresses
        other_result = await db.execute(
            select(Address)
            .where(
                Address.user_id == current_user.id,
                Address.id != address_id,
            )
            .limit(1)
        )
        other_address = other_result.scalar_one_or_none()
        if other_address:
            # Promote another address to default
            other_address.is_default = True

    await db.delete(address)
    await db.flush()
    return None


@router.put("/{address_id}/default", response_model=AddressResponse)
async def set_default_address(
    address_id: _uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set an address as the default shipping address."""
    result = await db.execute(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == current_user.id,
        )
    )
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    # Unset all other defaults for this user
    await db.execute(
        update(Address)
        .where(Address.user_id == current_user.id, Address.id != address_id)
        .values(is_default=False)
    )

    address.is_default = True
    await db.flush()
    return address
