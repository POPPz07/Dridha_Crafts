"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PRODUCTS_DATA, BUNDLES_DATA, StaticProduct } from "@/lib/products-data";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { Check, Heart, ShoppingBag, SlidersHorizontal } from "lucide-react";

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const categories = ["All", "Laptop Stands", "Audio Accessories", "Desk Organizers", "Phone Stands", "Tablet Stands", "Desk Decor"];

  let filtered =
    selectedCategory === "All"
      ? [...PRODUCTS_DATA]
      : PRODUCTS_DATA.filter((p) => p.category === selectedCategory);

  if (sortBy === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  }

  const handleAddToCart = (product: StaticProduct) => {
    addItem({
      id: `${product.id}-shop`,
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
    setQuickAddedId(product.id);
    setTimeout(() => setQuickAddedId(null), 1500);
    openCart();
  };

  return (
    <main className="min-h-screen pt-28 pb-16 bg-brand-cream">
      <Container>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="handcrafted" className="mb-3">
            Handcrafted in Kashmir Valley
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-green">
            The Complete Collection
          </h1>
          <p className="text-sm text-charcoal/70 mt-3 leading-relaxed">
            Every piece is carved from naturally fallen Himalayan walnut trees. Precision-fit, hand-polished, and delivered free across India.
          </p>
        </div>

        {/* Filters and Sorting Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-warmgrey/70 shadow-soft mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-brand-green text-white shadow-sm"
                    : "bg-brand-cream text-charcoal/70 hover:bg-warmgrey/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs self-end md:self-auto">
            <SlidersHorizontal className="w-4 h-4 text-brand-green" />
            <span className="text-charcoal/60">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-brand-cream border border-warmgrey/80 rounded-lg px-2.5 py-1.5 text-xs text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((product) => {
            const isAdded = quickAddedId === product.id;
            const inWishlist = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="group bg-white rounded-3xl overflow-hidden border border-warmgrey/70 hover:border-brand-gold/60 transition-all duration-500 hover:shadow-elevated flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-warmgrey/20">
                  <Image
                    src={product.images[0]?.url || "/images/image1.jpeg"}
                    alt={product.images[0]?.alt || product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-smooth"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {product.badge && (
                    <div className="absolute top-4 left-4">
                      <Badge variant="bestseller">{product.badge}</Badge>
                    </div>
                  )}

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${
                      inWishlist
                        ? "bg-brand-gold text-charcoal shadow-md"
                        : "bg-white/80 text-charcoal hover:bg-white"
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? "fill-charcoal" : ""}`} />
                  </button>
                </div>

                <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold">
                      {product.wood_type} • {product.category}
                    </p>
                    <h3 className="font-display text-xl font-bold text-brand-green group-hover:text-brand-brown transition-colors mt-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-charcoal/70 line-clamp-2 mt-2 leading-relaxed">
                      {product.short_description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-warmgrey/60 flex items-center justify-between">
                    <div>
                      <span className="font-display text-2xl font-bold text-brand-green">
                        {formatPrice(product.price)}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-xs text-charcoal/40 line-through ml-2">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>

                    <Button
                      variant={isAdded ? "gold" : "primary"}
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" /> Added
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="block text-center text-xs text-charcoal/50 hover:text-brand-green transition-colors mt-3 underline-offset-2 hover:underline"
                  >
                    View Full Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
