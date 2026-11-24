"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import {
  Check,
  ChevronLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Shield,
  Star,
  Truck,
  Box,
  Play,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRODUCTS_DATA, BUNDLES_DATA, StaticProduct, findProductOrBundleBySlug } from "@/lib/products-data";
import { getProductBySlug } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuthGatedAddToCart } from "@/hooks/useAuthGatedAddToCart";
import { ProductReviewsSection } from "@/components/products/ProductReviewsSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProductDetailSkeleton } from "@/components/ui/SkeletonCard";
import type { FinishOption } from "@/components/3d/woodMaterials";

const CustomCaddyScene = dynamic(
  () => import("@/components/3d/CustomCaddyScene").then((m) => m.CustomCaddyScene),
  {
    ssr: false,
    loading: () => <Loading3DBox label="Bespoke Desk Caddy 3D Model" />,
  }
);
const AtelierScene = dynamic(
  () => import("@/components/3d/AtelierScene").then((m) => m.AtelierScene),
  {
    ssr: false,
    loading: () => <Loading3DBox label="ShiftDesk 3D Model" />,
  }
);
const MobileHolderScene = dynamic(
  () => import("@/components/3d/MobileHolderScene").then((m) => m.MobileHolderScene),
  {
    ssr: false,
    loading: () => <Loading3DBox label="Mobile Stand 3D Model" />,
  }
);
const TabletStandScene = dynamic(
  () => import("@/components/3d/TabletStandScene").then((m) => m.TabletStandScene),
  {
    ssr: false,
    loading: () => <Loading3DBox label="Tablet Stand 3D Model" />,
  }
);
const DropzoneScene = dynamic(
  () => import("@/components/3d/DropzoneScene"),
  {
    ssr: false,
    loading: () => <Loading3DBox label="Dropzone Headphone Stand 3D Model" />,
  }
);

function Loading3DBox({ label }: { label: string }) {
  return (
    <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center bg-[#f0e4d0] gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#123526]/30 border-t-[#123526] animate-spin" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#123526]/60">
        Loading {label}…
      </span>
    </div>
  );
}

const SCENE_COMPONENTS: Record<string, React.ComponentType<{ finish?: FinishOption }>> = {
  "custom-artisan-desk-caddy": CustomCaddyScene,
  "shiftdesk-stand": AtelierScene,
  "signature-shiftdesk-stand": AtelierScene,
  "laptop-stand": TabletStandScene,
  "mobile-stand": MobileHolderScene,
  "tablet-stand": TabletStandScene,
  dropzone: DropzoneScene,
};

const POLISH_OPTIONS = [
  "Classic Natural Polish",
  "Rich Brown Polish",
];

interface ProductDetailClientProps {
  slug: string;
  initialProduct?: StaticProduct | null;
}

export function ProductDetailClient({ slug, initialProduct }: ProductDetailClientProps) {
  const fallback = initialProduct || findProductOrBundleBySlug(slug);
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
      <main className="min-h-screen bg-brand-cream pt-28">
        <Container>
          <ProductDetailSkeleton />
        </Container>
      </main>
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle="Unable to load product detail"
      fallbackMessage="We encountered an issue displaying this product piece. Please refresh or explore our full collection."
    >
      <ProductDetail key={product.slug} product={product} />
    </ErrorBoundary>
  );
}

function ProductDetail({ product }: { product: StaticProduct }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [viewMode, setViewMode] = useState<"photos" | "3d">("photos");

  // Check if current product is a duo or trio combo bundle
  const currentBundle = useMemo(
    () => BUNDLES_DATA.find((b) => b.slug === product.slug) || null,
    [product.slug]
  );
  const isBundle = Boolean(currentBundle);

  // For combos: maintain separate polish choice for each product in the bundle
  const [bundleFinishes, setBundleFinishes] = useState<Record<number, string>>(() => {
    return {
      0: "Classic Natural Polish",
      1: "Classic Natural Polish",
      2: "Classic Natural Polish",
    };
  });

  // Calculate polish surcharge for combos (+₹10 for mobile stand, +₹20 for others when Rich Brown Polish is selected)
  const bundlePolishSurcharge = useMemo(() => {
    if (!isBundle || !currentBundle) return 0;
    let surcharge = 0;
    currentBundle.items.forEach((item, idx) => {
      const finish = bundleFinishes[idx] || POLISH_OPTIONS[0];
      if (finish === "Rich Brown Polish") {
        surcharge += item.toLowerCase().includes("mobile") ? 10 : 20;
      }
    });
    return surcharge;
  }, [isBundle, currentBundle, bundleFinishes]);

  const ActiveScene = SCENE_COMPONENTS[product.slug];
  const activeVariant = product.variants?.find((v) => v.id === selectedVariantId) || null;

  const currentFinish = useMemo<FinishOption>(() => {
    if (isBundle) {
      const firstFinish = (bundleFinishes[0] || "").toLowerCase();
      if (firstFinish.includes("brown")) return "brown";
      return "transparent";
    }
    const name = (activeVariant?.variant_name || "").toLowerCase();
    if (name.includes("brown")) return "brown";
    return "transparent";
  }, [isBundle, bundleFinishes, activeVariant]);
  const currentPrice = isBundle
    ? product.price + bundlePolishSurcharge
    : (activeVariant?.price_override ?? product.price);
  const currentStock = activeVariant?.stock_quantity ?? product.stock_quantity ?? 10;
  const isOutOfStock = currentStock <= 0;

  const { addToCart } = useAuthGatedAddToCart();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  // Related products (same category, exclude self)
  const related = useMemo(
    () =>
      PRODUCTS_DATA.filter(
        (p) => p.category === product.category && p.id !== product.id
      ).slice(0, 3),
    [product.category, product.id]
  );

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    if (isBundle && currentBundle) {
      const finishSummary = currentBundle.items
        .map((item, idx) => `${item}: ${bundleFinishes[idx] || POLISH_OPTIONS[0]}`)
        .join(" | ");

      const added = await addToCart(
        {
          id: `${product.id}-${encodeURIComponent(finishSummary)}`,
          product_id: product.id,
          variant_id: null,
          quantity: 1,
          product: {
            name: product.name,
            slug: product.slug,
            price: currentPrice,
            primary_image_url: product.images[0]?.url || null,
            stock_quantity: currentStock,
          },
          variant: {
            variant_name: finishSummary,
            price_override: currentPrice,
          },
        },
        quantity
      );
      if (added) {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
      }
      return;
    }

    const added = await addToCart(
      {
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
      },
      quantity
    );
    if (added) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const images = product.images.length > 0 ? product.images : [{ url: "/images/image1.jpeg", alt: product.name }];

  // Build process steps from product data
  const processSteps = [
    {
      step: "01",
      title: "Pine Selection",
      desc: "Naturally fallen mountain pine wood is hand-selected for grain density, structural integrity, and natural moisture balance.",
    },
    {
      step: "02",
      title: "Cutting Precision & Dimension Decisions",
      desc: "Carefully planned dimensions and precision cutting decisions to achieve perfect angles and ergonomic stability.",
    },
    {
      step: "03",
      title: "Hand Profiling & Shaping",
      desc: "Master artisans hand-profile each edge and cut the contours to form the product into its true, balanced artisan shape.",
    },
  ];

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

          {/* ── LEFT: Media Viewer (Photos & Interactive 3D) ── */}
          <div className="lg:col-span-6 space-y-4">
            {/* View Mode Toggle Pill (when 3D is available) */}
            {ActiveScene && (
              <div className="flex items-center gap-1.5 p-1 bg-white border border-warmgrey/70 rounded-2xl w-fit shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("photos")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    viewMode === "photos"
                      ? "bg-brand-green text-white shadow-sm"
                      : "text-charcoal/60 hover:text-brand-green"
                  }`}
                >
                  Gallery Photos ({images.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("3d")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    viewMode === "3d"
                      ? "bg-brand-green text-white shadow-sm"
                      : "text-charcoal/60 hover:text-brand-green"
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-brand-gold" />
                  Interactive 3D
                </button>
              </div>
            )}

            {/* 3D Canvas or Photo Viewer */}
            {viewMode === "3d" && ActiveScene ? (
              <div className="space-y-1.5">
                <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-[#ecdcc6] border border-warmgrey/60 shadow-medium">
                  <div className="absolute inset-0 w-full h-full">
                    <ActiveScene finish={currentFinish} />
                  </div>
                  <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[10px] text-white font-medium select-none pointer-events-none">
                    <Box className="w-3 h-3 text-[#dfa663]" />
                    Drag to rotate • 360° Studio Model
                  </div>
                </div>
                <p className="text-[10px] text-charcoal/40 text-center tracking-tight select-none">
                  *Note: 3D model tones and grain patterns may vary slightly from authentic handcrafted wood finish.
                </p>
              </div>
            ) : (
              <>
                {/* Main Media */}
                <div
                  className={`relative aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-warmgrey/60 shadow-medium transition-all duration-300 flex items-center justify-center ${isZoomed ? "scale-[1.02]" : ""}`}
                >
                  {images[selectedImage]?.url.endsWith(".mp4") ? (
                    <video
                      key={images[selectedImage].url}
                      src={images[selectedImage].url}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      controlsList="nodownload noplaybackrate"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <Image
                        src={images[selectedImage]?.url || "/images/image1.jpeg"}
                        alt={images[selectedImage]?.alt || product.name}
                        fill
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`object-contain p-3 transition-transform duration-700 cursor-zoom-in select-none ${isZoomed ? "scale-125" : "scale-100"}`}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                        onClick={() => setIsZoomed(!isZoomed)}
                      />
                      {/* Zoom hint */}
                      <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] text-charcoal/70 font-medium select-none pointer-events-none">
                        {isZoomed ? "Click to zoom out" : "Click to zoom"}
                      </div>
                    </>
                  )}
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
                        title={img.alt}
                      >
                        {img.url.endsWith(".mp4") ? (
                          <div className="w-full h-full bg-[#123526] flex flex-col items-center justify-center text-brand-gold gap-1">
                            <Play className="w-5 h-5 fill-brand-gold" />
                            <span className="text-[8px] uppercase tracking-wider font-bold text-white">Video</span>
                          </div>
                        ) : (
                          <Image
                            src={img.url}
                            alt={img.alt}
                            fill
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            className="object-cover select-none"
                            sizes="80px"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Custom Commission Specifications & Wood Note */}
            {product.slug === "custom-artisan-desk-caddy" ? (
              <div className="p-5 bg-[#faf5eb] border border-[#d8963e]/30 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-brand-green font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-[#d8963e]" />
                  Bespoke Dimensions & Handcrafted Specifications
                </div>
                <p className="text-charcoal/80 leading-relaxed">
                  Crafted to order from solid pine: a hollow semi-cylinder tray featuring an artisan inward-carved lower contour at the far end, with a hollow side cylinder resting on its right surface area featuring a top aperture hole and natural knothole grain.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-[#123526]">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-warmgrey/60">Semi-Cylinder: 24 × 9.5 × 6.5 cm</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-warmgrey/60">Side Cylinder: Ø 6.2 cm (Top Hole)</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-warmgrey/60">Inward-Carved End Profile</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-warmgrey/60">Free Custom Engraving</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-brand-cream border border-warmgrey/80 rounded-2xl text-xs text-charcoal/70 space-y-1">
                <p className="font-semibold text-brand-green">Natural Pine Variance</p>
                <p>Each piece is individually carved from fallen pine. Grain patterns, knot placement, and rich tone gradients are unique to your individual piece.</p>
              </div>
            )}
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

              {/* Review summary anchor */}
              <a
                href="#reviews"
                className="inline-flex items-center gap-2 mt-2 group cursor-pointer"
              >
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-brand-gold text-brand-gold"
                    />
                  ))}
                </div>
                <span className="text-xs text-charcoal/60 group-hover:text-brand-green transition-colors font-medium">
                  Verified Collector Reviews
                </span>
              </a>
            </div>

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-4xl font-bold text-brand-green">
                  {formatPrice(currentPrice)}
                </span>
                {product.compare_at_price && (
                  <>
                    <span className="text-lg text-charcoal/40 line-through">
                      {formatPrice(product.compare_at_price + (isBundle ? bundlePolishSurcharge : 0))}
                    </span>
                    <Badge variant="sale">
                      Save ₹{isBundle ? (bundlePolishSurcharge > 0 ? (product.compare_at_price + bundlePolishSurcharge) - currentPrice : product.compare_at_price - product.price) : product.compare_at_price - currentPrice} ({isBundle ? (currentBundle?.type === "trio" ? "15% Combo OFF" : "10% Combo OFF") : `${Math.round(((product.compare_at_price - currentPrice) / product.compare_at_price) * 100)}% OFF`})
                    </Badge>
                  </>
                )}
                {isBundle && bundlePolishSurcharge > 0 && (
                  <span className="text-xs font-semibold text-brand-gold bg-brand-green/10 px-2.5 py-1 rounded-full">
                    Includes +₹{bundlePolishSurcharge} polish ({bundlePolishSurcharge / 20} piece{bundlePolishSurcharge > 20 ? "s" : ""})
                  </span>
                )}
              </div>
              {isBundle && product.compare_at_price && (
                <p className="text-xs text-charcoal/60 mt-1">
                  Individual items bought separately: <span className="font-semibold text-charcoal/80">{formatPrice(product.compare_at_price)}</span> • Extra {currentBundle?.type === "trio" ? "15%" : "10%"} Combo Discount applied
                </p>
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

            {/* 1. DUO / TRIO BUNDLE: Separate Polish Options For Each Product */}
            {isBundle && currentBundle && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-green">
                    Customize Polish for Each Piece
                  </label>
                  <span className="text-[11px] font-semibold text-brand-gold bg-brand-green/10 px-2.5 py-0.5 rounded-full">
                    {currentBundle.type === "trio" ? "Trio Finish Selection" : "Duo Finish Selection"}
                    {bundlePolishSurcharge > 0 && ` (+₹${bundlePolishSurcharge})`}
                  </span>
                </div>

                <div className="space-y-3">
                  {currentBundle.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="p-4 bg-white rounded-2xl border border-warmgrey/80 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-green text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {itemIdx + 1}
                        </span>
                        <span className="font-semibold text-xs text-brand-green">
                          {item}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {POLISH_OPTIONS.map((opt) => {
                          const isSelected = (bundleFinishes[itemIdx] || POLISH_OPTIONS[0]) === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setBundleFinishes((prev) => ({ ...prev, [itemIdx]: opt }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                                isSelected
                                  ? "border-brand-green bg-brand-green/10 text-brand-green shadow-xs"
                                  : "border-warmgrey bg-brand-cream/40 text-charcoal/70 hover:border-brand-green/40"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. INDIVIDUAL PRODUCT: Single Variant Selector (if variants are present) */}
            {!isBundle && product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
                  Select Finish &amp; Polish
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        if (v.image_url) {
                          const idx = images.findIndex((img) => img.url === v.image_url);
                          if (idx !== -1) {
                            setSelectedImage(idx);
                          }
                        } else {
                          setSelectedImage(0);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                        selectedVariantId === v.id
                          ? "border-brand-green bg-brand-green/10 text-brand-green shadow-xs"
                          : "border-warmgrey bg-white text-charcoal/70 hover:border-brand-green/40"
                      }`}
                    >
                      {v.variant_name}
                      {v.price_override ? ` (${formatPrice(v.price_override)})` : ""}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-charcoal/40 italic block pt-1 select-none">
                  *Note: 3D model colors may slightly differ from actual handcrafted pine finish.
                </span>
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
                { icon: <Truck className="w-4 h-4" />, label: "Pan-India Delivery" },
                { icon: <Shield className="w-4 h-4" />, label: "Secure Checkout" },
                { icon: <Box className="w-4 h-4" />, label: "Carefully Packed" },
                { icon: <Check className="w-4 h-4" />, label: "Custom Feasibility" },
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
                  { label: "Pine", value: product.wood_type },
                  { label: "Finish", value: product.finish },
                  { label: "Weight", value: `${product.weight_kg} kg` },
                  ...(product.dimensions ? [{ label: "Dimensions", value: product.dimensions }] : []),
                  { label: "Origin", value: "Kashmir Valley, India" },
                ].map((spec, idx) => (
                  <div key={idx} className="flex justify-between px-5 py-2.5">
                    <span className="text-charcoal/50 font-medium">{spec.label}</span>
                    <span className="text-charcoal font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unified Desk, Gifting & Bespoke Feasibility Note */}
            <div className="p-4 sm:p-5 rounded-2xl bg-brand-cream/60 border border-warmgrey/80 space-y-2 text-xs text-charcoal/75">
              <div className="flex items-center gap-2 text-brand-green font-semibold">
                <Sparkles className="w-4 h-4 text-brand-gold shrink-0" />
                <span>The Unified Desk &amp; Heirloom Gifting</span>
              </div>
              <p className="leading-relaxed">
                Part of our one-stop pine workstation ecosystem — designed to pair seamlessly with our laptop risers, mobile docks, audio headphone stands, and bookends. Dispatched with protective care for safe transit, accompanied by an authentic artisan seal.
              </p>
              <p className="text-[11px] text-charcoal/60 pt-2 border-t border-warmgrey/50">
                Need tailored dimensions or personalized engraving? Contact us via WhatsApp to check artisan feasibility.
              </p>
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
            <h2 className="font-display text-3xl font-bold text-brand-green">How It&apos;s Made</h2>
            <p className="text-sm text-charcoal/70 mt-2">Every step honours the pine and the artisan.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {processSteps.map((s) => (
              <div key={s.step} className="p-6 bg-white rounded-2xl border border-warmgrey/60 shadow-soft space-y-2">
                <span className="font-display text-3xl font-bold text-brand-gold/60">{s.step}</span>
                <h3 className="font-semibold text-brand-green text-sm">{s.title}</h3>
                <p className="text-xs text-charcoal/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Verified Customer Reviews & Ratings ──────────── */}
        <div id="reviews">
          <ProductReviewsSection productSlug={product.slug} productName={product.name} />
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
