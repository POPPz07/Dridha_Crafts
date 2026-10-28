"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRODUCTS_DATA } from "@/lib/products-data";
import { formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCartStore } from "@/stores/cartStore";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { productIds, removeFromWishlist, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const savedProducts = PRODUCTS_DATA.filter((p) => productIds.includes(p.id));

  return (
    <main className="min-h-screen pt-28 pb-16 bg-brand-cream">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-warmgrey/60">
          <div>
            <Badge variant="bestseller" className="mb-2">
              Saved Pieces
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-green">
              Your Personal Wishlist ({savedProducts.length})
            </h1>
          </div>
          {savedProducts.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs text-charcoal/60 hover:text-terracotta underline"
            >
              Clear all items
            </button>
          )}
        </div>

        {savedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-warmgrey p-8 max-w-lg mx-auto space-y-4">
            <Heart className="w-12 h-12 text-warmgrey-dark mx-auto" />
            <h2 className="font-display text-2xl font-bold text-charcoal">
              Your wishlist is empty
            </h2>
            <p className="text-xs text-charcoal/60 leading-relaxed">
              Save your favorite Kashmiri walnut accessories as you browse the collection.
            </p>
            <Link href="/shop" className="inline-block mt-2">
              <Button variant="primary">Browse Collection</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl overflow-hidden border border-warmgrey shadow-soft p-6 flex flex-col justify-between space-y-4"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-warmgrey/30">
                  <Image
                    src={product.images[0]?.url || "/images/image1.jpeg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-charcoal hover:text-terracotta transition-colors shadow-sm"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-brand-gold tracking-widest">
                    {product.wood_type}
                  </p>
                  <h3 className="font-display text-xl font-bold text-brand-green mt-1">
                    {product.name}
                  </h3>
                  <p className="font-display text-2xl font-bold text-brand-green mt-2">
                    {formatPrice(product.price)}
                  </p>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    addItem({
                      id: `${product.id}-wishlist`,
                      product_id: product.id,
                      variant_id: null,
                      quantity: 1,
                      product: {
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        primary_image_url: product.images[0]?.url || null,
                        stock_quantity: 20,
                      },
                      variant: null,
                    });
                    openCart();
                  }}
                  leftIcon={<ShoppingBag className="w-4 h-4" />}
                >
                  Move to Cart
                </Button>
              </div>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
