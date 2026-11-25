import asyncio
import sys
import os
import uuid
from decimal import Decimal

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import async_session
from app.models.product import Bundle, BundleItem, Product, ProductImage
from sqlalchemy import select, delete

BUNDLES_TO_SYNC = [
    {
        "id": uuid.UUID("da923af9-bc88-4b02-ab20-2ef88ba74fd4"),
        "name": "ShiftDesk + Dropzone Stand",
        "slug": "shiftdesk-headphone-stand",
        "description": "Multi-angle ergonomic wooden ShiftDesk riser paired with our Dropzone dual headphone & phone stand for an organized, premium workstation.",
        "price": Decimal("808.00"),
        "original_price": Decimal("898.00"),
        "image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/bundles/bundle-shiftdesk-headphone.jpg",
        "is_active": True,
        "is_featured": True,
        "items": [
            {"product_slug": "shiftdesk-stand", "quantity": 1},
            {"product_slug": "dropzone", "quantity": 1},
        ],
    },
    {
        "id": uuid.UUID("4506690d-fb08-4f9e-9db9-7c820befea09"),
        "name": "Laptop Stand + Dropzone Stand",
        "slug": "laptop-headphone-stand",
        "description": "Slotted Himalayan pine Laptop Stand paired with our Dropzone dual headphone & phone stand. Maximum airflow elevation with dedicated audio gear display.",
        "price": Decimal("718.00"),
        "original_price": Decimal("798.00"),
        "image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/bundles/bundle-laptop-headphone.jpg",
        "is_active": True,
        "is_featured": True,
        "items": [
            {"product_slug": "laptop-stand", "quantity": 1},
            {"product_slug": "dropzone", "quantity": 1},
        ],
    },
    {
        "id": uuid.UUID("9161dabd-4082-43b7-a400-bd28adfb6c6e"),
        "name": "ShiftDesk + Mobile Stand",
        "slug": "shiftdesk-mobile-stand",
        "description": "Dynamic 6-angle ShiftDesk riser paired with the interlocking Mobile Stand for seamless dual-screen workflow and hands-free video calls.",
        "price": Decimal("718.00"),
        "original_price": Decimal("798.00"),
        "image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/bundles/bundle-shiftdesk-mobile.jpg",
        "is_active": True,
        "is_featured": True,
        "items": [
            {"product_slug": "shiftdesk-stand", "quantity": 1},
            {"product_slug": "mobile-stand", "quantity": 1},
        ],
    },
    {
        "id": uuid.UUID("9e41736e-1d44-4118-bb88-7cee7987e6b7"),
        "name": "Laptop Stand + Mobile Stand",
        "slug": "laptop-mobile-stand",
        "description": "Ergonomic ventilation-cutout Laptop Stand paired with the interlocking Mobile Stand. Our signature Himalayan pine duo for compact productivity.",
        "price": Decimal("628.00"),
        "original_price": Decimal("698.00"),
        "image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/bundles/bundle-laptop-mobile.jpg",
        "is_active": True,
        "is_featured": True,
        "items": [
            {"product_slug": "laptop-stand", "quantity": 1},
            {"product_slug": "mobile-stand", "quantity": 1},
        ],
    },
    {
        "id": uuid.UUID("b1a10001-c888-4f01-b333-7cee7987e001"),
        "name": "ShiftDesk + Laptop Stand + Mobile Stand",
        "slug": "shiftdesk-laptop-mobile-trio",
        "description": "The complete multi-screen workstation: dynamic ShiftDesk riser, ventilated Multi-Angle Laptop Stand, and interlocking Mobile Stand for maximum ergonomic comfort.",
        "price": Decimal("1060.00"),
        "original_price": Decimal("1247.00"),
        "image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/bundles/bundle-shiftdesk-laptop-mobile.jpg",
        "is_active": True,
        "is_featured": True,
        "items": [
            {"product_slug": "shiftdesk-stand", "quantity": 1},
            {"product_slug": "laptop-stand", "quantity": 1},
            {"product_slug": "mobile-stand", "quantity": 1},
        ],
    },
    {
        "id": uuid.UUID("b1a10002-c888-4f01-b333-7cee7987e002"),
        "name": "ShiftDesk + Dropzone + Mobile Stand",
        "slug": "shiftdesk-dropzone-mobile-trio",
        "description": "The ultimate creator setup: adjustable ShiftDesk laptop riser, Dropzone dual headphone & phone cradle, and interlocking Mobile Stand for total desk organization.",
        "price": Decimal("975.00"),
        "original_price": Decimal("1147.00"),
        "image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/bundles/bundle-shiftdesk-dropzone-mobile.jpg",
        "is_active": True,
        "is_featured": True,
        "items": [
            {"product_slug": "shiftdesk-stand", "quantity": 1},
            {"product_slug": "dropzone", "quantity": 1},
            {"product_slug": "mobile-stand", "quantity": 1},
        ],
    },
    {
        "id": uuid.UUID("b1a10003-c888-4f01-b333-7cee7987e003"),
        "name": "Laptop Stand + Dropzone + Mobile Stand",
        "slug": "laptop-dropzone-mobile-trio",
        "description": "Lightweight, slotted Himalayan Pine Laptop Stand combined with our Dropzone headphone dock and interlocking Mobile Stand for streamlined efficiency.",
        "price": Decimal("890.00"),
        "original_price": Decimal("1047.00"),
        "image_url": "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/bundles/bundle-laptop-dropzone-mobile.jpg",
        "is_active": True,
        "is_featured": True,
        "items": [
            {"product_slug": "laptop-stand", "quantity": 1},
            {"product_slug": "dropzone", "quantity": 1},
            {"product_slug": "mobile-stand", "quantity": 1},
        ],
    },
]

async def sync():
    async with async_session() as session:
        # Also ensure dropzone has its H1 and H2 images assigned in DB
        hp = (await session.execute(select(Product).where(Product.slug.in_(["dropzone", "headphone-stand"])))).scalar_one_or_none()
        if hp:
            await session.execute(delete(ProductImage).where(ProductImage.product_id == hp.id))
            session.add(ProductImage(product_id=hp.id, image_url="https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/h-1.png", alt_text="Dropzone Angled View", is_primary=True, sort_order=0))
            session.add(ProductImage(product_id=hp.id, image_url="https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/h-2.png", alt_text="Dropzone Front View", is_primary=False, sort_order=1))
            await session.flush()
            print("Updated Dropzone images (H1, H2) in DB.")

        target_ids = {b["id"] for b in BUNDLES_TO_SYNC}
        existing_bundles = (await session.execute(select(Bundle))).scalars().all()

        for b in existing_bundles:
            if b.id not in target_ids:
                b.is_active = False

        for bdata in BUNDLES_TO_SYNC:
            target_id = bdata["id"]
            existing = (await session.execute(select(Bundle).where(Bundle.id == target_id))).scalar_one_or_none()
            if not existing:
                existing = (await session.execute(select(Bundle).where(Bundle.slug == bdata["slug"]))).scalar_one_or_none()

            if not existing:
                existing = Bundle(id=target_id)
                session.add(existing)

            existing.name = bdata["name"]
            existing.slug = bdata["slug"]
            existing.description = bdata["description"]
            existing.price = bdata["price"]
            existing.original_price = bdata["original_price"]
            existing.image_url = bdata["image_url"]
            existing.is_active = bdata["is_active"]
            existing.is_featured = bdata["is_featured"]

            await session.flush()

            # Refresh bundle items
            await session.execute(delete(BundleItem).where(BundleItem.bundle_id == existing.id))
            for item in bdata["items"]:
                prod = (await session.execute(select(Product).where(Product.slug == item["product_slug"]))).scalar_one_or_none()
                if prod:
                    bi = BundleItem(
                        bundle_id=existing.id,
                        product_id=prod.id,
                        quantity=item["quantity"],
                    )
                    session.add(bi)

            print(f"Synced bundle: {existing.name} (Rs.{existing.price}, Save Rs.{existing.original_price - existing.price})")

        await session.commit()
        print("Bundles database sync committed successfully!")

if __name__ == "__main__":
    asyncio.run(sync())
