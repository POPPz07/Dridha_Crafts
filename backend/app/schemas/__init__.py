"""Schemas package — Pydantic validation models for request/response data."""

from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    AddressCreate,
    AddressResponse,
    AddressUpdate,
)
from app.schemas.product import (
    ProductResponse,
    ProductListResponse,
    ProductImageResponse,
    ProductVariantResponse,
    BundleResponse,
    BundleListResponse,
    BundleItemResponse,
    PaginatedResponse,
)
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderStatusUpdate,
    PaymentConfirmation,
)
from app.schemas.review import (
    ReviewCreate,
    ReviewResponse,
    ReviewListResponse,
)
from app.schemas.cart import (
    CartItemAdd,
    CartItemUpdate,
    CartItemResponse,
    CartResponse,
)
from app.schemas.wishlist import (
    WishlistItemResponse,
    WishlistResponse,
)

__all__ = [
    # User
    "UserCreate",
    "UserResponse",
    "UserUpdate",
    "AddressCreate",
    "AddressResponse",
    "AddressUpdate",
    # Product
    "ProductResponse",
    "ProductListResponse",
    "ProductImageResponse",
    "ProductVariantResponse",
    "BundleResponse",
    "BundleListResponse",
    "BundleItemResponse",
    "PaginatedResponse",
    # Order
    "OrderCreate",
    "OrderResponse",
    "OrderItemResponse",
    "OrderListResponse",
    "OrderStatusUpdate",
    "PaymentConfirmation",
    # Review
    "ReviewCreate",
    "ReviewResponse",
    "ReviewListResponse",
    # Cart
    "CartItemAdd",
    "CartItemUpdate",
    "CartItemResponse",
    "CartResponse",
    # Wishlist
    "WishlistItemResponse",
    "WishlistResponse",
]
