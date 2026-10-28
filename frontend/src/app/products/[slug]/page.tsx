"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, Heart, Minus, Plus, ShoppingBag, Shield, Star, Truck, RefreshCw } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRODUCTS_DATA, StaticProduct } from "@/lib/products-data";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";

interface PageProps {
  params: { slug: string };
}

export default function ProductDetailPage({ params }: PageProps) {
  const product = PRODUCTS_DATA.find((p) => p.slug === params.slug);

  if (!product) return notFound();

  return <ProductDetail product={product} />;
}

function ProductDetail({ product }: { product: StaticProduct }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  // Related products (same category, exclude self)
  const related = PRODUCTS_DATA.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 3);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${product.id}-pdp`,
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

  // Fake rating data (will be replaced with real DB data when Supabase is set up)
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
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImage === i
                        ? "border-brand-gold shadow-soft scale-105"
                        : "border-warmgrey hover:border-brand-green/40"
                    }`}
                  >
                    <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}

            {/* Craftsmanship story below gallery */}
            <div className="bg-brand-green rounded-2xl p-6 text-brand-cream mt-4">
              <p className="font-accent text-brand-gold text-lg mb-2">Every piece is unique.</p>
              <p className="text-sm text-brand-cream/80 leading-relaxed">
                Because we use naturally fallen walnut timber, every product carries its own distinct grain pattern,
                knots, and natural character marks — making yours truly one of a kind.
              </p>
            </div>
          </div>

          {/* ── RIGHT: Product Info ────────────────────────── */}
          <div className="lg:col-span-6 space-y-6">
            {/* Category + Rating */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="handcrafted">{product.category}</Badge>
                {product.badge && <Badge variant="bestseller">{product.badge}</Badge>}
              </div>
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(fakeRating.avg) ? "fill-brand-gold text-brand-gold" : "text-warmgrey"}`}
                  />
                ))}
                <span className="text-xs text-charcoal/60 ml-1">({fakeRating.count} reviews)</span>
              </div>
            </div>

            {/* Name */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-1">
                {product.wood_type}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-green leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-brand-green">
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <>
                  <span className="text-lg text-charcoal/40 line-through">
                    {formatPrice(product.compare_at_price)}
                  </span>
                  <Badge variant="sale">
                    Save ₹{product.compare_at_price - product.price}
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-charcoal/75 leading-relaxed border-l-2 border-brand-gold/50 pl-4">
              {product.short_description}
            </p>

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
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-14 h-10 flex items-center justify-center border-y border-warmgrey bg-white font-semibold text-brand-green">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-r-xl border border-warmgrey bg-white hover:bg-warmgrey/40 transition-colors text-charcoal"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant={isAdded ? "gold" : "primary"}
                size="lg"
                onClick={handleAddToCart}
                className="flex-1 py-4 text-base"
              >
                {isAdded ? (
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
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-warmgrey/60 text-center">
                  <span className="text-brand-green">{t.icon}</span>
                  <span className="text-[10px] font-semibold text-charcoal/70">{t.label}</span>
                </div>
              ))}
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-2xl border border-warmgrey/70 overflow-hidden">
              <div className="px-5 py-3 bg-warmgrey/30 border-b border-warmgrey/60">
                <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/70">Specifications</h3>
              </div>
              <div className="divide-y divide-warmgrey/40">
                {[
                  ["Wood Type", product.wood_type || "Kashmiri Walnut"],
                  ["Finish", product.finish || "Natural Oil + Beeswax"],
                  ["Weight", product.weight_kg ? `${product.weight_kg} kg` : "~0.6 kg"],
                  ["Dimensions", product.dimensions || "Varies by product"],
                  ["Care", "Wipe with dry cloth. Re-oil every 6 months."],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-charcoal/60">{key}</span>
                    <span className="text-charcoal font-semibold text-right max-w-[180px]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment note */}
            <p className="text-xs text-charcoal/50 text-center pt-1">
              💳 Pay via Google Pay QR or Cash on Delivery · Free delivery Pan-India
            </p>
          </div>
        </div>
      </Container>

      {/* ── Craftsmanship Process ─────────────────────────── */}
      <section className="py-16 bg-brand-green text-brand-cream">
        <Container>
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold block mb-3">
              How It's Made
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-cream">
              The Making of Your{" "}
              <span className="italic font-normal text-brand-gold">{product.name}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, i) => (
              <div key={i} className="relative pl-5 border-l border-brand-gold/30">
                <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-brand-gold text-charcoal text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="font-display text-3xl font-bold text-brand-gold/20 block -mt-1 mb-1">
                  {step.step}
                </span>
                <h3 className="font-display text-lg font-bold text-brand-cream mb-2">{step.title}</h3>
                <p className="text-xs text-brand-cream/65 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Reviews Placeholder ───────────────────────────── */}
      <section className="py-16 bg-brand-cream border-t border-warmgrey/50">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-brand-green mb-2">
                Customer Reviews
              </h2>
              <div className="flex items-center justify-center gap-2 mb-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= Math.round(fakeRating.avg) ? "fill-brand-gold text-brand-gold" : "text-warmgrey"}`} />
                ))}
                <span className="font-display text-2xl font-bold text-brand-green ml-2">{fakeRating.avg}</span>
              </div>
              <p className="text-sm text-charcoal/60">Based on {fakeRating.count} reviews</p>
            </div>

            {/* Sample reviews (static for now, will connect to DB later) */}
            <div className="space-y-4">
              {[
                { name: "Rohan M.", rating: 5, text: "Absolutely love this! The wood grain is gorgeous and it's super sturdy. Worth every rupee.", date: "2 weeks ago" },
                { name: "Priya S.", rating: 5, text: "Got this as a gift for my husband. He was blown away by the quality. Packaging was also very premium!", date: "1 month ago" },
                { name: "Arjun K.", rating: 4, text: "Great product, solidly made. Slight imperfections in the wood but that's what makes it handcrafted!", date: "1 month ago" },
              ].map((review, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-warmgrey/60 shadow-soft">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-charcoal text-sm">{review.name}</p>
                      <p className="text-xs text-charcoal/50">{review.date}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-brand-gold text-brand-gold" : "text-warmgrey"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-charcoal/75 leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Related Products ──────────────────────────────── */}
      {related.length > 0 && (
        <section className="py-16 bg-white border-t border-warmgrey/50">
          <Container>
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl font-bold text-brand-green">
                You Might Also Love
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/products/${rel.slug}`}
                  className="group bg-brand-cream rounded-3xl overflow-hidden border border-warmgrey/70 hover:border-brand-gold/60 hover:shadow-elevated transition-all duration-500 flex flex-col"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-warmgrey/20">
                    <Image
                      src={rel.images[0]?.url || "/images/image1.jpeg"}
                      alt={rel.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-brand-green group-hover:text-brand-brown transition-colors">
                      {rel.name}
                    </h3>
                    <p className="font-display text-xl font-bold text-brand-green mt-1">
                      {formatPrice(rel.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Back to shop */}
      <div className="py-10 text-center bg-brand-cream border-t border-warmgrey/50">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-brand-green transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Collection
        </Link>
      </div>
    </main>
  );
}
