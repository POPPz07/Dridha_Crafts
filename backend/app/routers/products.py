"""
Dridha Crafts - Products Router
Public endpoints for browsing products, bundles, and categories.
"""

from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.product import Bundle, BundleItem, Product, ProductImage, ProductVariant
from app.models.review import Review
from app.schemas.product import (
    BundleItemResponse,
    BundleListResponse,
    BundleResponse,
    PaginatedResponse,
    ProductListResponse,
    ProductResponse,
)

router = APIRouter(prefix="/products", tags=["Products"])
bundle_router = APIRouter(prefix="/bundles", tags=["Bundles"])
category_router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=PaginatedResponse[ProductListResponse])
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(12, ge=1, le=50, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price"),
    wood_type: Optional[str] = Query(None, description="Filter by wood type"),
    sort_by: str = Query("created_at", pattern=r"^(name|price|created_at|sort_order)$"),
    sort_order: str = Query("desc", pattern=r"^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    List products with pagination, filtering, and sorting.

    Supports filtering by category, price range, search term, and wood type.
    """
    # Base query — only active products
    query = select(Product).where(Product.is_active == True)  # noqa: E712
    count_query = select(func.count(Product.id)).where(Product.is_active == True)  # noqa: E712

    # Apply filters
    if category:
        query = query.where(Product.category == category)
        count_query = count_query.where(Product.category == category)
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.short_description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    if min_price is not None:
        query = query.where(Product.price >= min_price)
        count_query = count_query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
        count_query = count_query.where(Product.price <= max_price)
    if wood_type:
        query = query.where(Product.wood_type == wood_type)
        count_query = count_query.where(Product.wood_type == wood_type)

    # Total count
    total = (await db.execute(count_query)).scalar() or 0

    # Sorting
    sort_column = getattr(Product, sort_by)
    query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    # Eager-load images for primary_image_url
    query = query.options(selectinload(Product.images))

    result = await db.execute(query)
    products = result.scalars().all()

    # Build response items
    items = []
    for product in products:
        primary_image = next(
            (img.image_url for img in product.images if img.is_primary),
            product.images[0].image_url if product.images else None,
        )
        items.append(
            ProductListResponse(
                id=product.id,
                name=product.name,
                slug=product.slug,
                short_description=product.short_description,
                category=product.category,
                price=product.price,
                compare_at_price=product.compare_at_price,
                wood_type=product.wood_type,
                finish=product.finish,
                is_featured=product.is_featured,
                stock_quantity=product.stock_quantity,
                primary_image_url=primary_image,
            )
        )

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/featured", response_model=list[ProductListResponse])
async def get_featured_products(
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Get featured products for the homepage."""
    query = (
        select(Product)
        .where(Product.is_active == True, Product.is_featured == True)  # noqa: E712
        .options(selectinload(Product.images))
        .order_by(Product.sort_order.asc())
        .limit(limit)
    )
    result = await db.execute(query)
    products = result.scalars().all()

    items = []
    for product in products:
        primary_image = next(
            (img.image_url for img in product.images if img.is_primary),
            product.images[0].image_url if product.images else None,
        )
        items.append(
            ProductListResponse(
                id=product.id,
                name=product.name,
                slug=product.slug,
                short_description=product.short_description,
                category=product.category,
                price=product.price,
                compare_at_price=product.compare_at_price,
                wood_type=product.wood_type,
                finish=product.finish,
                is_featured=product.is_featured,
                stock_quantity=product.stock_quantity,
                primary_image_url=primary_image,
            )
        )
    return items


@router.get("/{slug}", response_model=ProductResponse)
async def get_product_detail(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get full product details by slug.

    Includes images, variants, and review summary (average rating + count).
    """
    query = (
        select(Product)
        .where(Product.slug == slug, Product.is_active == True)  # noqa: E712
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
        )
    )
    result = await db.execute(query)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Review aggregation
    review_stats = await db.execute(
        select(
            func.coalesce(func.avg(Review.rating), 0).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        ).where(Review.product_id == product.id)
    )
    stats = review_stats.one()

    return ProductResponse(
        id=product.id,
        name=product.name,
        slug=product.slug,
        short_description=product.short_description,
        long_description=product.long_description,
        category=product.category,
        price=product.price,
        compare_at_price=product.compare_at_price,
        wood_type=product.wood_type,
        finish=product.finish,
        weight_kg=product.weight_kg,
        dimensions=product.dimensions,
        care_instructions=product.care_instructions,
        is_active=product.is_active,
        is_featured=product.is_featured,
        stock_quantity=product.stock_quantity,
        sort_order=product.sort_order,
        created_at=product.created_at,
        updated_at=product.updated_at,
        images=product.images,
        variants=[v for v in product.variants if v.is_active],
        average_rating=round(float(stats.avg_rating), 1),
        review_count=stats.review_count,
    )


# ── Bundle Endpoints ─────────────────────────────────────────────────────────


@bundle_router.get("", response_model=list[BundleListResponse])
async def list_bundles(
    db: AsyncSession = Depends(get_db),
):
    """List all active bundles."""
    query = (
        select(Bundle)
        .where(Bundle.is_active == True)  # noqa: E712
        .order_by(Bundle.created_at.desc())
    )
    result = await db.execute(query)
    bundles = result.scalars().all()
    return bundles


@bundle_router.get("/{slug}", response_model=BundleResponse)
async def get_bundle_detail(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get bundle details with included product items."""
    query = (
        select(Bundle)
        .where(Bundle.slug == slug, Bundle.is_active == True)  # noqa: E712
        .options(selectinload(Bundle.items).selectinload(BundleItem.product).selectinload(Product.images))
    )
    result = await db.execute(query)
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    # Build items with product details
    items = []
    for item in bundle.items:
        primary_image = None
        if item.product and item.product.images:
            primary_image = next(
                (img.image_url for img in item.product.images if img.is_primary),
                item.product.images[0].image_url if item.product.images else None,
            )
        items.append(
            BundleItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                product_name=item.product.name if item.product else None,
                product_slug=item.product.slug if item.product else None,
                product_price=item.product.price if item.product else None,
                product_image_url=primary_image,
            )
        )

    return BundleResponse(
        id=bundle.id,
        name=bundle.name,
        slug=bundle.slug,
        description=bundle.description,
        price=bundle.price,
        original_price=bundle.original_price,
        is_active=bundle.is_active,
        is_featured=bundle.is_featured,
        image_url=bundle.image_url,
        created_at=bundle.created_at,
        items=items,
    )


# ── Category Endpoints ───────────────────────────────────────────────────────


@category_router.get("")
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    """List unique product categories with product counts."""
    query = (
        select(
            Product.category,
            func.count(Product.id).label("product_count"),
        )
        .where(Product.is_active == True)  # noqa: E712
        .group_by(Product.category)
        .order_by(Product.category.asc())
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        {"category": row.category, "product_count": row.product_count}
        for row in rows
    ]
