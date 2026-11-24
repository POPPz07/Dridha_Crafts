"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PRODUCTS_DATA, BUNDLES_DATA, StaticProduct, StaticBundle } from "@/lib/products-data";
import { getProducts } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuthGatedAddToCart } from "@/hooks/useAuthGatedAddToCart";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Check, Heart, ShoppingBag, SlidersHorizontal, Sparkles, ArrowDown } from "lucide-react";

export function ShopClient() {
  const router = useRouter();
  const [products, setProducts] = useState<StaticProduct[]>(PRODUCTS_DATA);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [comboFilter, setComboFilter] = useState<"all" | "duo" | "trio">("all");
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);
  const [quickAddedBundleId, setQuickAddedBundleId] = useState<string | null>(null);

  const filteredBundles = useMemo(() => {
    if (comboFilter === "duo") return BUNDLES_DATA.filter((b) => b.type === "duo" || b.items.length === 2);
    if (comboFilter === "trio") return BUNDLES_DATA.filter((b) => b.type === "trio" || b.items.length === 3);
    return BUNDLES_DATA;
  }, [comboFilter]);

  useEffect(() => {
    getProducts().then((data) => {
      if (data && data.length > 0) {
        setProducts(data);
      }
    });
  }, []);

  // Smooth scroll to #combos if anchor is present in URL
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#combos") {
      const timer = setTimeout(() => {
        const el = document.getElementById("combos");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const { addToCart } = useAuthGatedAddToCart();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const categories = [
    "All",
    "Laptop and Tablet Stands",
    "Mobile Stands",
    "Headphone Stands",
    "Book Organizers",
  ];

  const filtered = useMemo(() => {
    const list =
      selectedCategory === "All"
        ? [...products]
        : products.filter((p) => p.category === selectedCategory);

    if (sortBy === "price-low") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, selectedCategory, sortBy]);

  const handleAddToCart = useCallback(
    async (product: StaticProduct) => {
      const defaultVariant =
        product.variants && product.variants.length > 0 ? product.variants[0] : null;
      const added = await addToCart({
        id: `${product.id}-shop`,
        product_id: product.id,
        variant_id: defaultVariant?.id || null,
        quantity: 1,
        product: {
          name: product.name,
          slug: product.slug,
          price: defaultVariant?.price_override ?? product.price,
          primary_image_url: product.images[0]?.url || null,
          stock_quantity: defaultVariant?.stock_quantity ?? product.stock_quantity ?? 20,
        },
        variant: defaultVariant
          ? {
              variant_name: defaultVariant.variant_name,
              price_override: defaultVariant.price_override ?? null,
            }
          : null,
      });
      if (added) {
        setQuickAddedId(product.id);
        setTimeout(() => setQuickAddedId(null), 1500);
      }
    },
    [addToCart]
  );

  const handleAddToCartBundle = useCallback(
    async (bundle: StaticBundle) => {
      const added = await addToCart({
        id: `${bundle.id}`,
        product_id: bundle.id,
        variant_id: null,
        quantity: 1,
        product: {
          name: bundle.name,
          slug: bundle.slug,
          price: bundle.price,
          primary_image_url: bundle.image,
          stock_quantity: 20,
        },
        variant: null,
      });
      if (added) {
        setQuickAddedBundleId(bundle.id);
        setTimeout(() => setQuickAddedBundleId(null), 1500);
      }
    },
    [addToCart]
  );

  return (
    <main className="min-h-screen pt-28 pb-24 bg-brand-cream">
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
            A unified one-stop atelier for your laptop, smartphone, audio gear, and literature.
            Explore individual artisan essentials, curated workstation gift suites, or inquire about bespoke commissions.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="#combos"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-xs font-semibold text-brand-green transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              Jump to Duo & Trio Combos (Up to 15% OFF)
              <ArrowDown className="w-3 h-3 text-brand-green" />
            </a>
          </div>
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

        {/* ── 1. INDIVIDUAL PRODUCTS GRID ─────────────────────── */}
        <ErrorBoundary fallbackTitle="Unable to load product grid" fallbackMessage="There was a temporary problem loading the individual pieces. Please refresh to try again.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((product) => {
            const isAdded = quickAddedId === product.id;
            const inWishlist = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${product.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(`/products/${product.slug}`);
                  }
                }}
                role="link"
                tabIndex={0}
                className="cursor-pointer group bg-white rounded-3xl overflow-hidden border border-warmgrey/70 hover:border-brand-gold/60 transition-all duration-500 hover:shadow-elevated flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-warmgrey/20">
                  <Image
                    src={product.images[0]?.url || "/images/sd-2.jpeg"}
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
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
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="inline-block mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                          Save ₹{product.compare_at_price - product.price}
                        </span>
                      )}
                    </div>

                    <Button
                      variant={isAdded ? "gold" : "primary"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="relative z-10"
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
                  <div className="flex items-center justify-center gap-1 text-center text-xs font-medium text-charcoal/50 group-hover:text-brand-green transition-colors mt-3">
                    <span>View Full Details</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </ErrorBoundary>

        {/* ── 2. WORKSTATION DUOS & COMBOS SECTION ────────────── */}
        <section id="combos" className="mt-28 pt-20 border-t border-warmgrey/70 scroll-mt-28">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold block mb-3">
              Curated Suites &amp; Heirloom Gift Sets • 10% to 15% Off
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green leading-tight">
              Office Desk
              <br />
              <span className="italic font-normal text-brand-brown">Collection</span>
            </h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-6 mb-6" />
            <p className="text-sm sm:text-base text-charcoal/75 leading-relaxed">
              Curated pairs and trios of Kashmir pine essentials — designed as complete workspace ecosystems and distinguished heirloom gift sets.
              Enjoy an automatic{" "}
              <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">
                10% off Duos
              </span>{" "}
              and{" "}
              <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">
                15% off Trios
              </span>{" "}
              for a harmonized, productive workspace.
            </p>
          </div>

          {/* Sub-filter tabs for Duos and Trios */}
          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            {[
              { key: "all", label: "All Combos (7)" },
              { key: "duo", label: "Workstation Duos (4 • 10% OFF)" },
              { key: "trio", label: "Artisan Trios (3 • 15% OFF)" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setComboFilter(tab.key as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  comboFilter === tab.key
                    ? "bg-brand-green text-white shadow-sm"
                    : "bg-white text-charcoal/70 hover:bg-warmgrey/50 border border-warmgrey/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ErrorBoundary fallbackTitle="Unable to load combo suites" fallbackMessage="There was an issue displaying our duo and trio combos. Please refresh to try again.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBundles.map((bundle) => {
              const isAdded = quickAddedBundleId === bundle.id;
              const isTrio = bundle.type === "trio" || bundle.items.length === 3;
              const discountPct = bundle.discount_percentage || (isTrio ? 15 : 10);

              return (
                <div
                  key={bundle.id}
                  onClick={() => router.push(`/products/${bundle.slug}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/products/${bundle.slug}`);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer bg-white rounded-3xl overflow-hidden border border-warmgrey/80 shadow-soft hover:shadow-elevated transition-all duration-500 flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                >
                  {/* Bundle Image */}
                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-warmgrey/20">
                    <Image
                      src={bundle.image}
                      alt={bundle.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-smooth"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                      <Badge variant="bestseller">{bundle.badge}</Badge>
                      <span className="text-[11px] font-bold text-emerald-800 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-emerald-300">
                        Save {discountPct}% (₹{bundle.savings})
                      </span>
                    </div>

                    {/* Dual/Trio item pills at bottom of image */}
                    {bundle.item_images && bundle.item_images.length > 0 && (
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-xs border border-warmgrey/60 flex items-center gap-1.5 pointer-events-none">
                        {bundle.item_images.map((img, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            {idx > 0 && <span className="text-[10px] font-bold text-brand-gold">+</span>}
                            <div className="relative w-6 h-6 rounded-md overflow-hidden bg-warmgrey/30">
                              <Image src={img} alt={`Item ${idx + 1}`} fill className="object-cover" sizes="24px" />
                            </div>
                          </div>
                        ))}
                        <span className="text-[10px] font-bold text-brand-green ml-1 uppercase tracking-wide">
                          {isTrio ? "Trio" : "Duo"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bundle Content */}
                  <div className="p-6 flex flex-col flex-1 justify-between gap-5">
                    <div>
                      <div className="mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md inline-block">
                          {isTrio ? "15% Price Reduction" : "10% Price Reduction"}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-brand-green group-hover:text-brand-brown transition-colors leading-snug">
                        {bundle.name}
                      </h3>
                      <p className="text-xs text-charcoal/70 leading-relaxed mt-2 line-clamp-2">
                        {bundle.description}
                      </p>

                      {/* Items checklist */}
                      <ul className="space-y-1.5 pt-4 mt-3 border-t border-warmgrey/60 text-xs text-charcoal/80 font-medium">
                        {bundle.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-warmgrey/70">
                      <div className="flex items-baseline justify-between mb-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-2xl font-bold text-brand-green">
                              {formatPrice(bundle.price)}
                            </span>
                            <span className="text-xs text-charcoal/40 line-through">
                              {formatPrice(bundle.original_price)}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 block">
                            Save ₹{bundle.savings} (Extra {discountPct}% Combo OFF)
                          </span>
                          <span className="text-[10px] text-charcoal/50 block">
                            Bought separately: {formatPrice(bundle.original_price)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant={isAdded ? "gold" : "primary"}
                        className="w-full relative z-10"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCartBundle(bundle);
                        }}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" /> Added to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 mr-1" /> {isTrio ? "Add Trio to Cart" : "Add Duo to Cart"}
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-center gap-1 text-center text-xs font-medium text-charcoal/50 group-hover:text-brand-green transition-colors mt-3">
                        <span>{isTrio ? "View Trio Details" : "View Duo Details"}</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </ErrorBoundary>
        </section>

        {/* ── 3. BESPOKE COMMISSIONS & CORPORATE GIFTING BANNER ── */}
        <section className="mt-24 mb-12 p-8 sm:p-12 rounded-3xl bg-brand-green text-white border border-brand-gold/30 shadow-elevated relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-brand-gold/10 pointer-events-none blur-2xl" />
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-gold inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-brand-gold/30">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              Artisan Consultation
            </span>
            <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Bespoke Commissions &amp; Corporate Gifting
            </h3>
            <p className="text-xs sm:text-sm text-brand-cream/80 leading-relaxed max-w-2xl mx-auto">
              Looking for tailored slot dimensions, personalized wood engraving, or curated executive gift sets for your team or special milestones? We undertake select custom commissions based on workshop feasibility.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/919767807889?text=Hello%20Dridha%20Crafts,%20I%20would%20like%20to%20inquire%20about%20a%20bespoke%20commission%20/%20corporate%20gifting."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gold text-brand-green text-xs font-bold uppercase tracking-wider hover:bg-white transition-all duration-300 shadow-sm"
              >
                Inquire with Our Artisan Atelier →
              </a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
