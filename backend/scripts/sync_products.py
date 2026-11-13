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
        "id": uuid.UUID("42cdd4b0-3192-4b4f-99e7-978e695bc015"),
        "name": "Solid Walnut Bookends (Pair)",
        "slug": "bookends",
        "category": "Book Organizers",
        "short_description": "Substantial architectural timber blocks weighted to support your books with rustic warmth.",
        "long_description": "Handcrafted from salvaged Kashmir timber. These substantial bookends showcase natural grain lines and annual growth rings while holding your library steady.",
        "price": Decimal("349.00"),
        "compare_at_price": Decimal("449.00"),
        "wood_type": "Kashmir Walnut",
        "finish": "Handcrafted Natural Timber",
        "weight_kg": Decimal("0.60"),
        "is_featured": True,
        "is_active": True,
        "stock_quantity": 25,
        "sort_order": 1,
        "images": [
            {"image_url": "/images/image11.png", "alt_text": "Solid Walnut Bookends (Pair)", "is_primary": True, "sort_order": 0},
        ],
        "variants": [
            {"variant_name": "Unpolished (Natural Raw Wood)", "variant_type": "Finish", "price_override": Decimal("349.00"), "stock_quantity": 25},
            {"variant_name": "Polished — Transparent Polish", "variant_type": "Finish", "price_override": Decimal("369.00"), "stock_quantity": 25},
            {"variant_name": "Polished — Brown Colour Polish", "variant_type": "Finish", "price_override": Decimal("369.00"), "stock_quantity": 25},
        ],
    },
    {
        "id": uuid.UUID("9180ed68-60bf-44b0-8f7f-bc8d0d691819"),
        "name": "ShiftDesk Stand (Adjustable)",
        "slug": "shiftdesk-stand",
        "category": "Laptop and Tablet Stands",
        "short_description": "Multi-angle ergonomic wooden riser with carved apertures and front retaining blocks.",
        "long_description": "Handcrafted from seasoned Kashmir timber. Precision engineered with multi-angle adjustment slots, allowing seamless adjustment between heavy typing and video conferencing.",
        "price": Decimal("549.00"),
        "compare_at_price": Decimal("699.00"),
        "wood_type": "Kashmir Pine & Walnut",
        "finish": "Multi-Angle Adjustable Elevation",
        "weight_kg": Decimal("0.80"),
        "is_featured": True,
        "is_active": True,
        "stock_quantity": 30,
        "sort_order": 2,
        "images": [
            {"image_url": "/images/sd-2.jpeg", "alt_text": "ShiftDesk Stand in Kashmir Valley on weathered timber", "is_primary": True, "sort_order": 0},
            {"image_url": "/images/sd-3.jpeg", "alt_text": "ShiftDesk Stand 6-angle elevation view", "is_primary": False, "sort_order": 1},
            {"image_url": "/images/sd-4.jpeg", "alt_text": "ShiftDesk Stand profile and angle riser view", "is_primary": False, "sort_order": 2},
            {"image_url": "/images/sd-polish-transparent.jpg", "alt_text": "ShiftDesk Stand - Transparent Polish finish", "is_primary": False, "sort_order": 3},
            {"image_url": "/images/sd-polish-brown.jpg", "alt_text": "ShiftDesk Stand - Brown Colour Polish finish", "is_primary": False, "sort_order": 4},
        ],
        "variants": [
            {"variant_name": "Unpolished (Natural Raw Wood)", "variant_type": "Finish", "price_override": Decimal("549.00"), "stock_quantity": 30},
            {"variant_name": "Polished — Transparent Polish", "variant_type": "Finish", "price_override": Decimal("569.00"), "stock_quantity": 30},
            {"variant_name": "Polished — Brown Colour Polish", "variant_type": "Finish", "price_override": Decimal("569.00"), "stock_quantity": 30},
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
        "is_featured": True,
        "is_active": True,
        "stock_quantity": 35,
        "sort_order": 3,
        "images": [
            {"image_url": "/images/ls-6.png", "alt_text": "Handcrafted Multi-Angle Laptop Stand on desk with laptop", "is_primary": True, "sort_order": 0},
            {"image_url": "/images/ls-1.jpg", "alt_text": "Handcrafted Laptop Stand top perspective on grass", "is_primary": False, "sort_order": 1},
            {"image_url": "/images/ls-2.jpg", "alt_text": "Handcrafted Laptop Stand angle view in sunlight", "is_primary": False, "sort_order": 2},
            {"image_url": "/images/ls-3.jpg", "alt_text": "Handcrafted Laptop Stand perspective with adjustment dowels", "is_primary": False, "sort_order": 3},
            {"image_url": "/images/ls-4.jpg", "alt_text": "Handcrafted Laptop Stand studio cutout", "is_primary": False, "sort_order": 4},
        ],
        "variants": [
            {"variant_name": "Unpolished (Natural Raw Wood)", "variant_type": "Finish", "price_override": Decimal("449.00"), "stock_quantity": 35},
            {"variant_name": "Polished — Transparent Polish", "variant_type": "Finish", "price_override": Decimal("469.00"), "stock_quantity": 35},
            {"variant_name": "Polished — Brown Colour Polish", "variant_type": "Finish", "price_override": Decimal("469.00"), "stock_quantity": 35},
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
        "sort_order": 4,
        "images": [
            {"image_url": "/images/ms-1.jpg", "alt_text": "Interlocking Wooden Mobile Stand on lawn", "is_primary": True, "sort_order": 0},
            {"image_url": "/images/ms-2.jpg", "alt_text": "Wooden Mobile Stand supporting smartphone on desk", "is_primary": False, "sort_order": 1},
            {"image_url": "/images/ms-3.jpg", "alt_text": "Dual Mobile Stands with transparent and brown finishes", "is_primary": False, "sort_order": 2},
            {"image_url": "/images/ms-4.jpg", "alt_text": "Two-piece interlocking mobile stand profile", "is_primary": False, "sort_order": 3},
            {"image_url": "/images/ms-polish-transparent.jpg", "alt_text": "Mobile Stand - Transparent Polish finish", "is_primary": False, "sort_order": 4},
            {"image_url": "/images/ms-polish-brown.jpg", "alt_text": "Mobile Stand - Brown Colour Polish finish", "is_primary": False, "sort_order": 5},
        ],
        "variants": [
            {"variant_name": "Unpolished (Natural Raw Wood)", "variant_type": "Finish", "price_override": Decimal("249.00"), "stock_quantity": 50},
            {"variant_name": "Polished — Transparent Polish", "variant_type": "Finish", "price_override": Decimal("259.00"), "stock_quantity": 50},
            {"variant_name": "Polished — Brown Colour Polish", "variant_type": "Finish", "price_override": Decimal("259.00"), "stock_quantity": 50},
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

            # Refresh variants
            await session.execute(delete(ProductVariant).where(ProductVariant.product_id == existing.id))
            for v in pdata["variants"]:
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
