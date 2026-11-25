import asyncio
import sys
import os
import uuid
from decimal import Decimal

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import async_session
from app.models.product import Product, ProductImage, ProductVariant
from sqlalchemy import select, delete

PRODUCTS_TO_SYNC = [
    {
        "id": uuid.UUID("9180ed68-60bf-44b0-8f7f-bc8d0d691819"),
        "name": "ShiftDesk Stand (Adjustable)",
        "slug": "shiftdesk-stand",
        "category": "Laptop and Tablet Stands",
        "short_description": "Multi-angle ergonomic wooden riser with carved apertures and front retaining blocks.",
        "long_description": "Handcrafted from seasoned Kashmir pine. Precision engineered with multi-angle adjustment slots, allowing seamless adjustment between heavy typing and video conferencing.",
        "price": Decimal("549.00"),
        "compare_at_price": Decimal("699.00"),
        "wood_type": "Kashmir Pine",
        "finish": "Multi-Angle Adjustable Elevation",
        "weight_kg": Decimal("0.80"),
        "dimensions": "11 × 6 inches",
        "is_featured": True,
        "is_active": True,
        "stock_quantity": 30,
        "sort_order": 1,
        "images": [
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-2.jpeg", "alt_text": "ShiftDesk Stand in Kashmir Valley on weathered pine", "is_primary": True, "sort_order": 0},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-3.jpeg", "alt_text": "ShiftDesk Stand 6-angle elevation view", "is_primary": False, "sort_order": 1},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-4.jpeg", "alt_text": "ShiftDesk Stand profile and angle riser view", "is_primary": False, "sort_order": 2},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-polish-transparent.jpg", "alt_text": "ShiftDesk Stand - Transparent Polish finish", "is_primary": False, "sort_order": 3},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-polish-brown.jpg", "alt_text": "ShiftDesk Stand - Brown Colour Polish finish", "is_primary": False, "sort_order": 4},
        ],
        "variants": [
            {"variant_name": "Classic Natural Polish", "variant_type": "Finish", "price_override": Decimal("549.00"), "stock_quantity": 30},
            {"variant_name": "Rich Brown Polish", "variant_type": "Finish", "price_override": Decimal("569.00"), "stock_quantity": 30},
        ],
    },
    {
        "id": uuid.UUID("5f235bcd-1d7c-4003-b181-3b98b0d93240"),
        "name": "Handcrafted Multi-Angle Laptop Stand",
        "slug": "laptop-stand",
        "category": "Laptop and Tablet Stands",
        "short_description": "Solid wooden laptop riser featuring central ventilation cutout and multi-level adjustment pegs.",
        "long_description": "Artisan-carved from Kashmir Valley pine. Features a diamond airflow center, rounded adjustment holes, and dual locking pins for ergonomic elevation.",
        "price": Decimal("449.00"),
        "compare_at_price": Decimal("579.00"),
        "wood_type": "Kashmir Valley Pine",
        "finish": "Slotted Multi-Level Elevation",
        "weight_kg": Decimal("0.70"),
        "dimensions": "11 × 6 inches",
        "is_featured": True,
        "is_active": True,
        "stock_quantity": 35,
        "sort_order": 2,
        "images": [
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ls-6.png", "alt_text": "Handcrafted Multi-Angle Laptop Stand on desk with laptop", "is_primary": True, "sort_order": 0},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ls-1.jpg", "alt_text": "Handcrafted Laptop Stand top perspective on grass", "is_primary": False, "sort_order": 1},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ls-2.jpg", "alt_text": "Handcrafted Laptop Stand angle view in sunlight", "is_primary": False, "sort_order": 2},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ls-3.jpg", "alt_text": "Handcrafted Laptop Stand perspective with adjustment dowels", "is_primary": False, "sort_order": 3},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ls-4.jpg", "alt_text": "Handcrafted Laptop Stand studio cutout", "is_primary": False, "sort_order": 4},
        ],
        "variants": [
            {"variant_name": "Classic Natural Polish", "variant_type": "Finish", "price_override": Decimal("449.00"), "stock_quantity": 35},
            {"variant_name": "Rich Brown Polish", "variant_type": "Finish", "price_override": Decimal("469.00"), "stock_quantity": 35},
        ],
    },
    {
        "id": uuid.UUID("31e508df-81ec-41cb-9446-79855ce4e9bd"),
        "name": "Interlocking Wooden Mobile Stand",
        "slug": "mobile-stand",
        "category": "Mobile Stands",
        "short_description": "Two-piece interlocking phone cradle with charging cable notch and ergonomic tilt.",
        "long_description": "Carved from Kashmir Valley pine. The upright backrest and slotted perch lock together effortlessly for desk use, video calls, and charging.",
        "price": Decimal("249.00"),
        "compare_at_price": Decimal("349.00"),
        "wood_type": "Kashmir Valley Pine",
        "finish": "Two-Piece Interlocking Joinery",
        "weight_kg": Decimal("0.20"),
        "is_featured": True,
        "is_active": True,
        "stock_quantity": 50,
        "sort_order": 3,
        "images": [
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ms-1.jpg", "alt_text": "Interlocking Wooden Mobile Stand on lawn", "is_primary": True, "sort_order": 0},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ms-2.jpg", "alt_text": "Wooden Mobile Stand supporting smartphone on desk", "is_primary": False, "sort_order": 1},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ms-3.jpg", "alt_text": "Dual Mobile Stands with transparent and brown finishes", "is_primary": False, "sort_order": 2},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ms-4.jpg", "alt_text": "Two-piece interlocking mobile stand profile", "is_primary": False, "sort_order": 3},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ms-polish-transparent.jpg", "alt_text": "Mobile Stand - Transparent Polish finish", "is_primary": False, "sort_order": 4},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ms-polish-brown.jpg", "alt_text": "Mobile Stand - Brown Colour Polish finish", "is_primary": False, "sort_order": 5},
        ],
        "variants": [
            {"variant_name": "Classic Natural Polish", "variant_type": "Finish", "price_override": Decimal("249.00"), "stock_quantity": 50},
            {"variant_name": "Rich Brown Polish", "variant_type": "Finish", "price_override": Decimal("259.00"), "stock_quantity": 50},
        ],
    },
    {
        "id": uuid.UUID("0be46bc7-8940-4123-8259-ff1e025bc391"),
        "name": "Dropzone",
        "slug": "dropzone",
        "category": "Headphone Stands",
        "short_description": "Dual-purpose headphone perch and smartphone cradle carved from authentic Kashmir pine for an organized desk.",
        "long_description": "Handcrafted from sustainably sourced Kashmir Valley pine. The Dropzone combines a curved arch for hanging over-ear headphones with an ergonomic front cradle to hold your smartphone upright for notifications, video calls, or charging. A compact, sculptural desk centerpiece designed with zero-deforestation principles.",
        "price": Decimal("349.00"),
        "compare_at_price": Decimal("399.00"),
        "wood_type": "Kashmir Valley Pine",
        "finish": "Dual-Purpose Headphone & Phone Dock",
        "weight_kg": Decimal("0.35"),
        "dimensions": "6 × 6 × 10 inches",
        "is_featured": True,
        "is_active": True,
        "stock_quantity": 40,
        "sort_order": 4,
        "images": [
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/h-1.png", "alt_text": "Dropzone Headphone & Phone Stand angled desk view", "is_primary": True, "sort_order": 0},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/h-2.png", "alt_text": "Dropzone Headphone & Phone Stand front profile view", "is_primary": False, "sort_order": 1},
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/h-3.jpeg", "alt_text": "Dropzone Headphone & Phone Stand artisan detail view", "is_primary": False, "sort_order": 2},
        ],
        "variants": [
            {"variant_name": "Classic Natural Polish", "variant_type": "Finish", "price_override": Decimal("349.00"), "stock_quantity": 40},
            {"variant_name": "Rich Brown Polish", "variant_type": "Finish", "price_override": Decimal("369.00"), "stock_quantity": 40},
        ],
    },
    {
        "id": uuid.UUID("42cdd4b0-3192-4b4f-99e7-978e695bc015"),
        "name": "Solid Bookends (Pair)",
        "slug": "bookends",
        "category": "Book Organizers",
        "short_description": "Substantial architectural pine blocks weighted to support your books with rustic warmth.",
        "long_description": "Handcrafted from salvaged Kashmir pine. These substantial bookends showcase natural grain lines and annual growth rings while holding your library steady.",
        "price": Decimal("349.00"),
        "compare_at_price": Decimal("449.00"),
        "wood_type": "Kashmir Pine",
        "finish": "Handcrafted Natural Pine",
        "weight_kg": Decimal("0.60"),
        "is_featured": True,
        "is_active": True,
        "stock_quantity": 25,
        "sort_order": 5,
        "images": [
            {"image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/image11.png", "alt_text": "Solid Bookends (Pair)", "is_primary": True, "sort_order": 0},
        ],
        "variants": [
            {"variant_name": "Classic Natural Polish", "variant_type": "Finish", "price_override": Decimal("349.00"), "stock_quantity": 25},
            {"variant_name": "Rich Brown Polish", "variant_type": "Finish", "price_override": Decimal("369.00"), "stock_quantity": 25},
        ],
    },
]

async def sync():
    async with async_session() as session:
        # First, deactivate all existing products
        all_db_products = (await session.execute(select(Product))).scalars().all()
        active_slugs = {p["slug"] for p in PRODUCTS_TO_SYNC}
        active_ids = {p["id"] for p in PRODUCTS_TO_SYNC}

        for db_p in all_db_products:
            if db_p.id not in active_ids and db_p.slug not in active_slugs:
                db_p.is_active = False
                print(f"Deactivating legacy product: {db_p.name} ({db_p.slug})")

        # Now upsert each of the 4 target products
        for pdata in PRODUCTS_TO_SYNC:
            target_id = pdata["id"]
            existing = (await session.execute(select(Product).where(Product.id == target_id))).scalar_one_or_none()
            if not existing:
                existing = (await session.execute(select(Product).where(Product.slug == pdata["slug"]))).scalar_one_or_none()

            if not existing:
                existing = Product(id=target_id)
                session.add(existing)

            existing.name = pdata["name"]
            existing.slug = pdata["slug"]
            existing.category = pdata["category"]
            existing.short_description = pdata["short_description"]
            existing.long_description = pdata["long_description"]
            existing.price = pdata["price"]
            existing.compare_at_price = pdata["compare_at_price"]
            existing.wood_type = pdata["wood_type"]
            existing.finish = pdata["finish"]
            existing.weight_kg = pdata["weight_kg"]
            existing.dimensions = pdata.get("dimensions")
            existing.is_featured = pdata["is_featured"]
            existing.is_active = pdata["is_active"]
            existing.stock_quantity = pdata["stock_quantity"]
            existing.sort_order = pdata["sort_order"]

            await session.flush()

            # Refresh images
            await session.execute(delete(ProductImage).where(ProductImage.product_id == existing.id))
            for img in pdata["images"]:
                new_img = ProductImage(
                    product_id=existing.id,
                    image_url=img["image_url"],
                    alt_text=img["alt_text"],
                    is_primary=img["is_primary"],
                    sort_order=img["sort_order"],
                )
                session.add(new_img)

            # Refresh variants safely without violating foreign keys from existing orders
            existing_vars = (await session.execute(select(ProductVariant).where(ProductVariant.product_id == existing.id))).scalars().all()
            var_map = {v.variant_name: v for v in existing_vars}
            for v in pdata["variants"]:
                if v["variant_name"] in var_map:
                    ev = var_map[v["variant_name"]]
                    ev.variant_type = v["variant_type"]
                    ev.price_override = v["price_override"]
                    ev.stock_quantity = v["stock_quantity"]
                    ev.is_active = True
                else:
                    new_var = ProductVariant(
                        product_id=existing.id,
                        variant_name=v["variant_name"],
                        variant_type=v["variant_type"],
                        price_override=v["price_override"],
                        stock_quantity=v["stock_quantity"],
                        is_active=True,
                    )
                    session.add(new_var)

            print(f"Synced product: {existing.name} (Rs.{existing.price}, Save Rs.{existing.compare_at_price - existing.price})")

        await session.commit()
        print("Database sync committed successfully!")

if __name__ == "__main__":
    asyncio.run(sync())
