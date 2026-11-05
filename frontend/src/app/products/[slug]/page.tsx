"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, Heart, Minus, Plus, ShoppingBag, Shield, Star, Truck, RefreshCw, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRODUCTS_DATA, StaticProduct } from "@/lib/products-data";
import { getProductBySlug } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const fallback = PRODUCTS_DATA.find((p) => p.slug === slug);
  const [product, setProduct] = useState<StaticProduct | null>(fallback || null);
  const [isLoading, setIsLoading] = useState(!fallback);

  useEffect(() => {
    let isMounted = true;
    getProductBySlug(slug).then((res) => {
      if (isMounted) {
        if (res) {
          setProduct(res);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!product && !isLoading) return notFound();
  if (!product) {
    return (
      <main className="min-h-screen bg-brand-cream pt-28 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </main>
    );
  }

  return <ProductDetail product={product} />;
}

function ProductDetail({ product }: { product: StaticProduct }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const activeVariant = product.variants?.find((v) => v.id === selectedVariantId) || null;
  const currentPrice = activeVariant?.price_override ?? product.price;
  const currentStock = activeVariant?.stock_quantity ?? product.stock_quantity ?? 10;
  const isOutOfStock = currentStock <= 0;

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  // Related products (same category, exclude self)
  const related = PRODUCTS_DATA.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 3);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: activeVariant ? `${product.id}-${activeVariant.id}` : `${product.id}-pdp`,
        product_id: product.id,
        variant_id: activeVariant ? activeVariant.id : null,
        quantity: 1,
        product: {
          name: product.name,
          slug: product.slug,
          price: currentPrice,
          primary_image_url: product.images[0]?.url || null,
          stock_quantity: currentStock,
        },
        variant: activeVariant
          ? {
              variant_name: activeVariant.variant_name,
              price_override: activeVariant.price_override ?? null,
            }
          : null,
      });
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    openCart();
  };

  const images = product.images.length > 0 ? product.images : [{ url: "/images/image1.jpeg", alt: product.name }];

  // Build process steps from product data
  const processSteps = [
    { step: "01", title: "Timber Selection", desc: "Naturally fallen Kashmiri walnut is hand-selected for grain density and moisture content." },
    { step: "02", title: "Hand Profiling", desc: "Artisans shape each piece with traditional gouges, following natural grain directions." },
    { step: "03", title: "Six-Grit Sanding", desc: "Sanded progressively up to 600-grit for a silky-smooth, warm-to-touch surface." },
    { step: "04", title: "Organic Oil Finish", desc: "Sealed with natural walnut oil and beeswax — food-safe, zero-plastic finish." },
  ];

  const fakeRating = { avg: 4.8, count: 12 };

  return (
    <main className="min-h-screen bg-brand-cream pt-20">
      {/* Breadcrumb */}
      <div className="border-b border-warmgrey/50 bg-white/50">
        <Container>
          <div className="py-3 flex items-center gap-2 text-xs text-charcoal/50">
            <Link href="/" className="hover:text-brand-green transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-brand-green transition-colors">Collection</Link>
            <span>/</span>
            <span className="text-charcoal/80 font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </Container>
      </div>

      {/* ── Main PDP Layout ─────────────────────────────── */}
      <Container>
        <div className="py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* ── LEFT: Image Gallery ───────────────────────── */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Image */}
            <div
              className={`relative aspect-[4/3] rounded-3xl overflow-hidden bg-warmgrey/20 cursor-zoom-in border border-warmgrey/60 shadow-medium transition-all duration-300 ${isZoomed ? "scale-[1.02]" : ""}`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <Image
                src={images[selectedImage]?.url || "/images/image1.jpeg"}
                alt={images[selectedImage]?.alt || product.name}
                fill
                className={`object-cover transition-transform duration-700 ${isZoomed ? "scale-125" : "scale-100"}`}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] text-charcoal/70 font-medium">
                {isZoomed ? "Click to zoom out" : "Click to zoom"}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                      selectedImage === idx
                        ? "border-brand-green ring-2 ring-brand-green/20"
                        : "border-warmgrey opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}

            {/* Natural Material Note */}
            <div className="p-4 bg-brand-cream border border-warmgrey/80 rounded-2xl text-xs text-charcoal/70 space-y-1">
              <p className="font-semibold text-brand-green">Natural Timber Variance</p>
              <p>Each piece is individually carved from fallen walnut trees. Grain patterns, knot placement, and rich tone gradients are unique to your individual piece.</p>
            </div>
          </div>

          {/* ── RIGHT: Product Details ─────────────────────── */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Badge & Category */}
              <div className="flex items-center gap-2 mb-2">
                {product.badge && (
                  <Badge variant={product.badge === "Bestseller" ? "bestseller" : "new"}>
                    {product.badge}
                  </Badge>
                )}
                <span className="text-xs uppercase tracking-widest text-charcoal/50 font-medium">
                  {product.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-green">
                {product.name}
              </h1>

              {/* Review summary */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(fakeRating.avg)
                          ? "fill-brand-gold text-brand-gold"
                          : "text-warmgrey fill-warmgrey"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-charcoal/60">
                  {fakeRating.avg} ({fakeRating.count} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-brand-green">
                {formatPrice(currentPrice)}
              </span>
              {product.compare_at_price && (
                <>
                  <span className="text-lg text-charcoal/40 line-through">
                    {formatPrice(product.compare_at_price)}
                  </span>
                  <Badge variant="sale">
                    Save ₹{product.compare_at_price - currentPrice}
                  </Badge>
                </>
              )}
            </div>

            {/* Stock indicator */}
            <div>
              {isOutOfStock ? (
                <span className="inline-block px-3 py-1 bg-terracotta/10 text-terracotta border border-terracotta/30 rounded-full text-xs font-semibold">
                  Out of Stock
                </span>
              ) : currentStock <= 5 ? (
                <span className="text-xs text-amber-700 font-medium">
                  Only {currentStock} left in stock — order soon
                </span>
              ) : (
                <span className="text-xs text-brand-green font-medium">
                  In stock • Ready to dispatch
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-charcoal/75 leading-relaxed border-l-2 border-brand-gold/50 pl-4">
              {product.short_description}
            </p>

            {/* Variant Selector (if variants are present) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
                  Select {product.variants[0].variant_type || "Option"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                        selectedVariantId === v.id
                          ? "border-brand-green bg-brand-green/10 text-brand-green"
                          : "border-warmgrey bg-white text-charcoal/70 hover:border-brand-green/40"
                      }`}
                    >
                      {v.variant_name}
                      {v.price_override ? ` (${formatPrice(v.price_override)})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
                Quantity
              </label>
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-l-xl border border-warmgrey bg-white hover:bg-warmgrey/40 transition-colors text-charcoal"
                  aria-label="Decrease quantity"
                  disabled={isOutOfStock}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-14 h-10 flex items-center justify-center border-y border-warmgrey bg-white font-semibold text-brand-green">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(Math.min(currentStock || 10, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-r-xl border border-warmgrey bg-white hover:bg-warmgrey/40 transition-colors text-charcoal"
                  aria-label="Increase quantity"
                  disabled={isOutOfStock || quantity >= currentStock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant={isOutOfStock ? "outline" : isAdded ? "gold" : "primary"}
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-4 text-base ${isOutOfStock ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {isOutOfStock ? (
                  "Out of Stock"
                ) : isAdded ? (
                  <><Check className="w-5 h-5 mr-2" /> Added to Cart!</>
                ) : (
                  <><ShoppingBag className="w-5 h-5 mr-2" /> Add to Cart</>
                )}
              </Button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`flex items-center justify-center gap-2 px-5 py-4 rounded-lg border-2 transition-all duration-300 text-sm font-medium ${
                  inWishlist
                    ? "bg-brand-gold/10 border-brand-gold text-brand-brown"
                    : "border-warmgrey text-charcoal/70 hover:border-brand-green hover:text-brand-green"
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${inWishlist ? "fill-brand-gold text-brand-gold" : ""}`} />
                {inWishlist ? "Wishlisted" : "Wishlist"}
              </button>
            </div>

            {/* Trust Badges Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { icon: <Truck className="w-4 h-4" />, label: "Free Delivery" },
                { icon: <Shield className="w-4 h-4" />, label: "Secure Checkout" },
                { icon: <RefreshCw className="w-4 h-4" />, label: "Easy Returns" },
                { icon: <Check className="w-4 h-4" />, label: "Pune Inspected" },
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-warmgrey/70 text-xs text-charcoal/70">
                  <span className="text-brand-green shrink-0">{badge.icon}</span>
                  <span className="font-medium text-[11px] leading-tight">{badge.label}</span>
                </div>
              ))}
            </div>

            {/* Specifications Table */}
            <div className="border border-warmgrey rounded-2xl overflow-hidden bg-white">
              <div className="px-5 py-3 bg-brand-green/5 border-b border-warmgrey">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-green">Specifications</p>
              </div>
              <div className="divide-y divide-warmgrey text-xs">
                {[
                  { label: "Timber", value: product.wood_type },
                  { label: "Finish", value: product.finish },
                  { label: "Weight", value: `${product.weight_kg} kg` },
                  ...(product.dimensions ? [{ label: "Dimensions", value: product.dimensions }] : []),
                  { label: "Origin", value: "Kashmir Valley, India" },
                  { label: "Packaging", value: "Eco-friendly, 5-ply corrugated box" },
                ].map((spec, idx) => (
                  <div key={idx} className="flex justify-between px-5 py-2.5">
                    <span className="text-charcoal/50 font-medium">{spec.label}</span>
                    <span className="text-charcoal font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Story / Long Description Section ────────────── */}
        {product.long_description && (
          <div className="py-12 border-t border-warmgrey/60 max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-brand-green mb-4">
              The Story Behind This Piece
            </h2>
            <div className="prose prose-sm text-charcoal/80 leading-relaxed space-y-4">
              <p>{product.long_description}</p>
            </div>
          </div>
        )}

        {/* ── Artisanal Process Steps ───────────────────────── */}
        <div className="py-16 border-t border-warmgrey/60">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-brown mb-2">The Craft</p>
            <h2 className="font-display text-3xl font-bold text-brand-green">How It's Made</h2>
            <p className="text-sm text-charcoal/70 mt-2">Every step honours the timber and the artisan.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((s) => (
              <div key={s.step} className="p-6 bg-white rounded-2xl border border-warmgrey/60 shadow-soft space-y-2">
                <span className="font-display text-3xl font-bold text-brand-gold/60">{s.step}</span>
                <h3 className="font-semibold text-brand-green text-sm">{s.title}</h3>
                <p className="text-xs text-charcoal/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Related Products ─────────────────────────────── */}
        {related.length > 0 && (
          <div className="py-16 border-t border-warmgrey/60">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-brand-green">More in {product.category}</h2>
              <Link href="/shop" className="text-xs font-semibold text-brand-brown hover:text-brand-green transition-colors flex items-center gap-1">
                View All <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link key={item.id} href={`/products/${item.slug}`} className="group block bg-white rounded-2xl border border-warmgrey/60 overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300">
                  <div className="relative aspect-[4/3] bg-warmgrey/20 overflow-hidden">
                    <Image src={item.images[0]?.url || "/images/image1.jpeg"} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="33vw" />
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-xs text-charcoal/50 uppercase tracking-wide">{item.category}</p>
                    <h3 className="font-semibold text-sm text-brand-green group-hover:text-brand-brown transition-colors">{item.name}</h3>
                    <p className="font-display font-bold text-brand-green">{formatPrice(item.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
