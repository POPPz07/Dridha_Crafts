"""
Dridha Crafts - Custom Inquiries Router
Handles bespoke inquiries, WhatsApp chat initiation logging, admin approvals,
and tamper-proof cart-locking for custom Kashmiri pine products.
"""

import uuid
from decimal import Decimal
from typing import Optional, List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.custom_inquiry import CustomInquiry
from app.models.user import User
from app.middleware.auth import get_optional_user, get_current_admin

router = APIRouter(prefix="/custom-inquiries", tags=["Custom Inquiries"])


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class CustomInquiryCreate(BaseModel):
    product_slug: str = Field(..., min_length=1, max_length=100)
    product_name: str = Field(..., min_length=1, max_length=255)
    customer_name: Optional[str] = Field(None, max_length=150)
    customer_phone: Optional[str] = Field(None, max_length=50)
    customer_email: Optional[str] = Field(None, max_length=255)
    custom_title: Optional[str] = Field(None, max_length=255)
    requested_dimensions: Optional[str] = Field(None, max_length=500)
    requested_details: Optional[str] = Field(None, max_length=1000)
    whatsapp_message: Optional[str] = Field(None, max_length=2000)
    model_config = {"extra": "forbid"}


class CustomInquiryApprove(BaseModel):
    approved_price: Decimal = Field(..., gt=0)
    approved_dimensions: Optional[str] = Field(None, max_length=500)
    artisan_notes: Optional[str] = Field(None, max_length=1000)
    model_config = {"extra": "forbid"}


class CustomInquiryReject(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)
    model_config = {"extra": "forbid"}


class CustomInquiryLockCart(BaseModel):
    custom_title: Optional[str] = Field(None, max_length=255)
    final_dimensions: Optional[str] = Field(None, max_length=500)
    model_config = {"extra": "forbid"}


class CustomInquiryResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    product_slug: str
    product_name: str
    custom_title: Optional[str] = None
    requested_dimensions: Optional[str] = None
    approved_dimensions: Optional[str] = None
    requested_details: Optional[str] = None
    approved_price: Optional[float] = None
    artisan_notes: Optional[str] = None
    status: str
    whatsapp_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_model(cls, m: CustomInquiry) -> "CustomInquiryResponse":
        return cls(
            id=str(m.id),
            user_id=str(m.user_id) if m.user_id else None,
            customer_name=m.customer_name,
            customer_phone=m.customer_phone,
            customer_email=m.customer_email,
            product_slug=m.product_slug,
            product_name=m.product_name,
            custom_title=m.custom_title,
            requested_dimensions=m.requested_dimensions,
            approved_dimensions=m.approved_dimensions,
            requested_details=m.requested_details,
            approved_price=float(m.approved_price) if m.approved_price is not None else None,
            artisan_notes=m.artisan_notes,
            status=m.status,
            whatsapp_message=m.whatsapp_message,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )


# ---------------------------------------------------------------------------
# Public / Customer Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=CustomInquiryResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_inquiry(
    data: CustomInquiryCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Log an initiated customization inquiry before launching WhatsApp chat.
    Safe for both guests and authenticated users.
    """
    user_id = user.id if user else None
    customer_name = data.customer_name or (user.full_name if user else None)
    customer_phone = data.customer_phone or (user.phone if user else None)
    customer_email = data.customer_email or (user.email if user else None)

    inquiry = CustomInquiry(
        user_id=user_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        product_slug=data.product_slug,
        product_name=data.product_name,
        custom_title=data.custom_title,
        requested_dimensions=data.requested_dimensions,
        requested_details=data.requested_details,
        status="pending_chat",
        whatsapp_message=data.whatsapp_message,
    )
    db.add(inquiry)
    await db.commit()
    await db.refresh(inquiry)

    return CustomInquiryResponse.from_orm_model(inquiry)


@router.get("/my", response_model=List[CustomInquiryResponse])
async def get_my_custom_inquiries(
    product_slug: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Fetch active customization inquiries for the current user or guest (by phone/email).
    Allows client to check if admin approved the inquiry to unlock Add to Cart.
    """
    stmt = select(CustomInquiry).order_by(desc(CustomInquiry.created_at))

    conditions = []
    if user:
        conditions.append(CustomInquiry.user_id == user.id)
    elif email:
        conditions.append(CustomInquiry.customer_email == email)
    elif phone:
        conditions.append(CustomInquiry.customer_phone == phone)
    else:
        return []

    if product_slug:
        stmt = stmt.where(CustomInquiry.product_slug == product_slug)

    from sqlalchemy import or_
    stmt = stmt.where(or_(*conditions)).limit(20)

    result = await db.execute(stmt)
    inquiries = result.scalars().all()
    return [CustomInquiryResponse.from_orm_model(i) for i in inquiries]


@router.get("/{inquiry_id}", response_model=CustomInquiryResponse)
async def get_inquiry_by_id(
    inquiry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Poll a single inquiry status by ID."""
    result = await db.execute(select(CustomInquiry).where(CustomInquiry.id == inquiry_id))
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Custom inquiry not found")
    return CustomInquiryResponse.from_orm_model(inquiry)


@router.post("/{inquiry_id}/lock-cart")
async def lock_custom_inquiry_into_cart(
    inquiry_id: uuid.UUID,
    data: CustomInquiryLockCart,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Called when customer clicks 'Add to Cart' after admin approval.
    Validates that the inquiry is approved, attaches custom title / dimensions,
    and returns authoritative pricing for the cart.
    """
    result = await db.execute(select(CustomInquiry).where(CustomInquiry.id == inquiry_id))
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Custom inquiry not found")

    if inquiry.status != "approved":
        raise HTTPException(
            status_code=400,
            detail=f"Inquiry is not approved for ordering. Current status: '{inquiry.status}'. Please finalize details on WhatsApp first."
        )

    if inquiry.approved_price is None or inquiry.approved_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Inquiry does not have an approved price set by the artisan."
        )

    if data.custom_title:
        inquiry.custom_title = data.custom_title
    if data.final_dimensions:
        inquiry.requested_dimensions = data.final_dimensions

    inquiry.status = "in_cart"
    inquiry.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(inquiry)

    return {
        "success": True,
        "inquiry_id": str(inquiry.id),
        "product_slug": inquiry.product_slug,
        "product_name": inquiry.product_name,
        "custom_title": inquiry.custom_title or inquiry.product_name,
        "price": float(inquiry.approved_price),
        "dimensions": inquiry.approved_dimensions or inquiry.requested_dimensions,
        "status": inquiry.status,
    }


# ---------------------------------------------------------------------------
# Admin Endpoints (Require Super Admin)
# ---------------------------------------------------------------------------

@router.get("/admin/all", response_model=List[CustomInquiryResponse])
async def admin_get_all_inquiries(
    status_filter: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Fetch all customization inquiries with optional status filtering."""
    stmt = select(CustomInquiry).order_by(desc(CustomInquiry.created_at))
    if status_filter and status_filter != "all":
        stmt = stmt.where(CustomInquiry.status == status_filter)
    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    inquiries = result.scalars().all()
    return [CustomInquiryResponse.from_orm_model(i) for i in inquiries]


@router.patch("/admin/{inquiry_id}/approve", response_model=CustomInquiryResponse)
async def admin_approve_inquiry(
    inquiry_id: uuid.UUID,
    data: CustomInquiryApprove,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Finalize agreed specs, set authoritative pricing, and unlock cart for user."""
    result = await db.execute(select(CustomInquiry).where(CustomInquiry.id == inquiry_id))
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Custom inquiry not found")

    inquiry.approved_price = data.approved_price
    if data.approved_dimensions is not None:
        inquiry.approved_dimensions = data.approved_dimensions
    if data.artisan_notes is not None:
        inquiry.artisan_notes = data.artisan_notes

    inquiry.status = "approved"
    inquiry.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(inquiry)

    return CustomInquiryResponse.from_orm_model(inquiry)


@router.patch("/admin/{inquiry_id}/reject", response_model=CustomInquiryResponse)
async def admin_reject_inquiry(
    inquiry_id: uuid.UUID,
    data: CustomInquiryReject,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Reject or close inquiry if custom specifications are not feasible."""
    result = await db.execute(select(CustomInquiry).where(CustomInquiry.id == inquiry_id))
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Custom inquiry not found")

    inquiry.status = "rejected"
    if data.reason:
        inquiry.artisan_notes = f"Rejected: {data.reason}"
    inquiry.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(inquiry)

    return CustomInquiryResponse.from_orm_model(inquiry)
