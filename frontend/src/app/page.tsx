"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Check,
  ShoppingBag,
  Heart,
  ChevronDown,
  Boxes,
  Sparkles,
  Shield,
  Gift,
} from "lucide-react";
import { ImageHero } from "@/components/sections/ImageHero";
import { MaterialSection } from "@/components/sections/MaterialSection";

const ShiftDesk3DSection = dynamic(
  () => import("@/components/sections/ShiftDesk3DSection").then((m) => m.ShiftDesk3DSection),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[480px] bg-brand-cream/60 flex flex-col items-center justify-center p-8 text-charcoal/40">
        <div className="w-8 h-8 rounded-full border-2 border-brand-green/30 border-t-brand-green animate-spin mb-3" />
        <span className="text-xs uppercase tracking-widest font-bold text-brand-green/60">Loading ShiftDesk 3D Studio…</span>
      </div>
    ),
  }
);

const MobileStand3DSection = dynamic(
  () => import("@/components/sections/MobileStand3DSection").then((m) => m.MobileStand3DSection),
  {
    ssr: false,
    loading: () => <div className="w-full min-h-[400px] bg-brand-cream/40" />,
  }
);

const TabletStand3DSection = dynamic(
  () => import("@/components/sections/TabletStand3DSection").then((m) => m.TabletStand3DSection),
  {
    ssr: false,
    loading: () => <div className="w-full min-h-[400px] bg-brand-cream/40" />,
  }
);

const Dropzone3DSection = dynamic(
  () => import("@/components/sections/Dropzone3DSection").then((m) => m.Dropzone3DSection),
  {
    ssr: false,
    loading: () => <div className="w-full min-h-[400px] bg-brand-cream/40" />,
  }
);

const CustomCaddy3DSection = dynamic(
  () => import("@/components/sections/CustomCaddy3DSection").then((m) => m.CustomCaddy3DSection),
  {
    ssr: false,
    loading: () => <div className="w-full min-h-[400px] bg-brand-cream/40" />,
  }
);

// Social SVG icons & links
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const SOCIAL_LINKS = {
  youtube: "https://youtube.com/@dridha_crafts?si=AqfNqP7CNxkKbAtf",
  instagram: "https://www.instagram.com/dridha_crafts?dlrf=ODVtZ2VvZ3Flcng=",
  facebook: "https://www.facebook.com/share/19hvBRRtFT/",
};
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRODUCTS_DATA, BUNDLES_DATA, StaticProduct } from "@/lib/products-data";
import { getProducts } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuthGatedAddToCart } from "@/hooks/useAuthGatedAddToCart";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<StaticProduct[]>(PRODUCTS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);
  const [quickAddedBundleId, setQuickAddedBundleId] = useState<string | null>(null);

  useEffect(() => {
    getProducts().then((data) => {
      if (data && data.length > 0) {
        setProducts(data);
      }
    });
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

  const featuredHomeProducts = useMemo(() => {
    const featuredSlugs = ["shiftdesk-stand", "dropzone"];
    const found = products.filter((p) => featuredSlugs.includes(p.slug));
    return found.length >= 2 ? found : products.slice(0, 2);
  }, [products]);

  const featuredHomeBundles = useMemo(() => {
    // Show 1 featured Duo (10% Off) and 1 featured Trio (15% Off) on the homepage
    const featuredDuo = BUNDLES_DATA.find((b) => b.slug === "shiftdesk-headphone-stand") || BUNDLES_DATA[0];
    const featuredTrio = BUNDLES_DATA.find((b) => b.slug === "shiftdesk-dropzone-mobile-trio") || BUNDLES_DATA[4];
    return [featuredDuo, featuredTrio];
  }, []);

  const handleAddToCart = async (product: StaticProduct) => {
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    const added = await addToCart({
      id: `${product.id}-default`,
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
  };

  const handleAddToCartBundle = async (bundle: (typeof BUNDLES_DATA)[0]) => {
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
  };

  return (
    <main className="min-h-screen">

      {/* ── 1. IMAGE HERO ─────────────────────────────────── */}
      <ImageHero />

      {/* ── 2. ETHOS MARQUEE STRIP ────────────────────────── */}
      <section className="bg-brand-green border-y border-brand-green-light/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-brand-gold/20">
            {[
              { icon: "🌲", text: "Zero Deforestation", sub: "Fallen Mountain Pine" },
              { icon: "🏛️", text: "One-Stop Desk Atelier", sub: "Laptop, Phone, Audio & Books" },
              { icon: "🎁", text: "Heirloom Gifting", sub: "Meaningful Desk Keepsakes" },
              { icon: "✍️", text: "Bespoke Commissions", sub: "Upon Artisan Feasibility" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4 py-4 text-center sm:text-left">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-brand-cream text-sm font-semibold">{item.text}</p>
                  <p className="text-brand-gold/70 text-xs">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. ORIGIN STORY ───────────────────────────────── */}
      <section id="story" className="py-24 lg:py-32 bg-brand-cream overflow-hidden">
        <Container>
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-20" data-animate="fade-up" suppressHydrationWarning>
            <span className="font-accent text-brand-brown text-2xl block mb-3">
              — Our Humble Beginning —
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green leading-tight">
              From Kashmir Highlands
              <br />
              <span className="italic font-normal text-brand-brown">to Your Desk</span>
            </h2>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto mt-6 mb-6" />
            <p className="text-charcoal/70 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              In the heart of the Kashmir Valley, nature commands patience. Ancient mountain
              trees yield aged wood naturally. We gather what nature has surrendered —
              breathing new life into every contour.
            </p>
          </div>

          {/* Story Chapter Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20" data-animate="stagger" suppressHydrationWarning>
            {[
              {
                num: "01",
                title: "The Salvaged Pine",
                desc: "We maintain a strict zero-felling policy. Every grain tells a story of mountain winters, meltwater rivers, and Himalayan winds. The wood cures naturally before it ever touches a tool.",
                img: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-2.jpeg",
                imgAlt: "ShiftDesk Stand crafted from aged Himalayan pine",
              },
              {
                num: "02",
                title: "The Master's Hands",
                desc: "Generations of woodworkers in Kashmir carry an unspoken dialogue with pine. Using traditional gouges and chisels, each desk accessory is hand-shaped, sanded through six grits, and oiled with natural wax.",
                img: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/h-1.png",
                imgAlt: "Artisan sculpted Solid Wood Headphone Stand",
              },
              {
                num: "03",
                title: "Your Thoughtful Workspace",
                desc: "Technology is sterile and plastic. Dridha Crafts brings tactile soul back to your workspace. A gentle touch of organic wood that elevates your mindset every time you sit down to create.",
                img: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ls-6.png",
                imgAlt: "Handcrafted Multi-Angle Laptop Stand workspace setup",
              },
            ].map((chapter, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl overflow-hidden border border-warmgrey/70 shadow-soft hover:shadow-elevated transition-all duration-500 group"
                data-animate="stagger-child"
                suppressHydrationWarning
              >
                {/* Image */}
                <div className="relative h-52 w-full overflow-hidden bg-warmgrey/20">
                  <Image
                    src={chapter.img}
                    alt={chapter.imgAlt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 to-transparent" />
                </div>
                {/* Content */}
                <div className="p-8">
                  <span className="font-display text-5xl font-bold text-brand-gold/30">
                    {chapter.num}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-brand-green mt-2 mb-3">
                    {chapter.title}
                  </h3>
                  <p className="text-sm text-charcoal/70 leading-relaxed">{chapter.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Packaging Promise */}
          <div className="bg-white rounded-3xl border border-warmgrey shadow-medium overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              {/* Image */}
              <div className="md:col-span-5 relative w-full h-full min-h-[340px] sm:min-h-[440px] bg-[#dfd4be] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                <div className="relative w-full h-full min-h-[320px] sm:min-h-[420px] aspect-[889/1024]">
                  <Image
                    src="https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/gift-card.jpg"
                    alt="Dridha Crafts Packaging Thank You Card"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    priority
                  />
                </div>
              </div>
              {/* Content */}
              <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-4">
                <Badge variant="handcrafted">Care &amp; Delivery</Badge>
                <h3 className="font-display text-3xl sm:text-4xl font-bold text-brand-green leading-tight">
                  The Living Character of Handcrafted Wood
                </h3>
                <div className="space-y-3 font-body text-base text-charcoal/80 leading-relaxed">
                  <p>
                    When you unbox your Dridha Crafts piece, you may notice subtle
                    uneven surfaces, organic grain ripples, or a gentle touch of natural
                    rawness. These are not defects — they are the honest hallmarks of
                    authentic mountain pine.
                  </p>
                  <p>
                    Every piece is shaped by Kashmiri artisan hands directly from
                    naturally fallen trees, carving what the valley has surrendered
                    into the finest functional craft possible. That tactile rawness and
                    natural imperfection is what gives each item its soul: bringing the
                    living warmth and character of Kashmir pine to work beside you every
                    day.
                  </p>
                </div>
                <p className="font-accent text-brand-brown text-2xl pt-1">
                  Crafted with care, just for you.
                </p>
                <p className="text-xs text-charcoal/50 pt-2 border-t border-warmgrey/50">
                  Every Dridha Crafts order is packed with protective care for safe transit, accompanied by our signature thank-you note and authentic artisan seal.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3b. MATERIAL & CRAFT VIDEO ─────────────────────── */}
      <MaterialSection />

      {/* ── 4. PRODUCT COLLECTION ─────────────────────────── */}
      <section id="collection" className="py-24 lg:py-32 bg-white border-t border-warmgrey/50">
        <Container>
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold block mb-2">
                The Artisan Series
              </span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green leading-tight">
                The Dridha
                <br />
                <span className="italic font-normal text-brand-brown">Collection</span>
              </h2>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold mb-1">
                Featured Flagships • 2 of 5 Essentials
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-brand-brown transition-colors group"
              >
                Explore Full 5-Piece Catalog <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Product Grid - 2 Featured Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto" data-animate="stagger" suppressHydrationWarning>
            {featuredHomeProducts.map((product) => {
              const isHovered = hoveredProduct === product.id;
              const hasAlternate = product.images.length > 1;
              const currentImage =
                isHovered && hasAlternate ? product.images[1] : product.images[0];
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
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  className="cursor-pointer group bg-brand-cream rounded-3xl overflow-hidden border border-warmgrey/70 hover:border-brand-gold/60 transition-all duration-500 hover:shadow-elevated flex flex-col focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  data-animate="stagger-child"
                  suppressHydrationWarning
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-warmgrey/20">
                    <Image
                      src={currentImage?.url || "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-2.jpeg"}
                      alt={currentImage?.alt || product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute top-4 left-4">
                        <Badge variant="bestseller">{product.badge}</Badge>
                      </div>
                    )}

                    {/* Wishlist */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 z-10 ${
                        inWishlist
                          ? "bg-brand-gold text-charcoal shadow-md scale-110"
                          : "bg-white/80 text-charcoal hover:bg-white hover:scale-110"
                      }`}
                      aria-label="Save to wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${inWishlist ? "fill-charcoal" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-1">
                        {product.wood_type} · {product.category}
                      </p>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-green group-hover:text-brand-brown transition-colors leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-charcoal/65 line-clamp-2 mt-2 leading-relaxed">
                        {product.short_description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-warmgrey/60 flex items-center justify-between gap-3">
                      <div>
                        {product.slug === "custom-artisan-desk-caddy" ? (
                          <div>
                            <span className="font-display text-base sm:text-lg font-bold text-brand-green block leading-tight">
                              Pricing on Request*
                            </span>
                            <span className="text-[10px] text-charcoal/50 block">
                              *Price depending on product specifications
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="font-display text-2xl font-bold text-brand-green">
                                {formatPrice(product.price)}
                              </span>
                              {product.compare_at_price && (
                                <span className="text-xs text-charcoal/40 line-through">
                                  {formatPrice(product.compare_at_price)}
                                </span>
                              )}
                            </div>
                            {product.compare_at_price && product.compare_at_price > product.price && (
                              <span className="inline-block mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                                Save ₹{product.compare_at_price - product.price}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {product.slug === "custom-artisan-desk-caddy" ? (
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/products/${product.slug}`);
                          }}
                          className="shrink-0 relative z-10"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Customize
                        </Button>
                      ) : (
                        <Button
                          variant={isAdded ? "gold" : "primary"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className="shrink-0 relative z-10"
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
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-center text-xs font-medium text-charcoal/50 group-hover:text-brand-green transition-colors mt-2">
                      <span>View Details</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All CTA */}
          <div className="text-center mt-14">
            <Link href="/shop">
              <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Full Collection (5 Products)
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* ── 4b. 3D INTERACTIVE FORM STUDIES ────────────────── */}
      <ShiftDesk3DSection />
      <MobileStand3DSection />
      <TabletStand3DSection />
      <Dropzone3DSection />
      <CustomCaddy3DSection />

      {/* ── 4c. THE DRIDHA DISTINCTION (UNIFIED ECOSYSTEM, HEIRLOOM GIFTING & BESPOKE CRAFT) ── */}
      <section className="py-20 lg:py-28 bg-white border-t border-warmgrey/70">
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold block mb-2.5">
              The Artisan Standard
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-green leading-tight">
              The Dridha Distinction
            </h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-5 mb-5" />
            <p className="text-sm sm:text-base text-charcoal/70 leading-relaxed">
              Every detail is shaped with calm intention — from individual ergonomic pieces to complete workstation suites and heirloom gift sets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: One-Stop Desk Ecosystem */}
            <div className="p-8 rounded-3xl bg-brand-cream/50 border border-warmgrey/80 flex flex-col justify-between hover:shadow-soft hover:border-brand-green/30 transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green mb-6">
                  <Boxes className="w-6 h-6 text-brand-green" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-green mb-3">
                  The Complete Desk Atelier
                </h3>
                <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed">
                  A unified one-stop ecosystem for your entire workspace. Multi-angle laptop stands, interlocking mobile docks, dual headphone cradles, and pine bookends — all sharing the same Himalayan grain and organic warmth.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-warmgrey/60 flex items-center gap-2 text-xs font-bold text-brand-green uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                <span>One Harmonious Aesthetic</span>
              </div>
            </div>

            {/* Pillar 2: Gifting */}
            <div className="p-8 rounded-3xl bg-brand-cream/50 border border-warmgrey/80 flex flex-col justify-between hover:shadow-soft hover:border-brand-gold/50 transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 flex items-center justify-center text-brand-gold mb-6">
                  <Gift className="w-6 h-6 text-brand-gold" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-green mb-3">
                  Heirloom &amp; Thoughtful Gifting
                </h3>
                <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed">
                  A meaningful, functional gift that sits proudly on the desk for years. Each individual piece and curated combo is crafted from fallen pine and dispatched with protective transit packing, an artisan seal, and our note card.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-warmgrey/60 flex items-center gap-2 text-xs font-bold text-brand-green uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                <span>Timeless Desk Keepsakes</span>
              </div>
            </div>

            {/* Pillar 3: Bespoke Craft */}
            <div className="p-8 rounded-3xl bg-brand-cream/50 border border-warmgrey/80 flex flex-col justify-between hover:shadow-soft hover:border-brand-brown/40 transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-brown/10 flex items-center justify-center text-brand-brown mb-6">
                  <Shield className="w-6 h-6 text-brand-brown" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-green mb-3">
                  Bespoke Commissions
                </h3>
                <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed">
                  Have unique workstation dimensions, specialized equipment requirements, or custom wood engraving requests? We periodically accept custom commissions based on artisan workshop feasibility.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-warmgrey/60 flex items-center gap-2 text-xs font-bold text-brand-green uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                <span>Artisan Feasibility Inquiries</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 5. OFFICE DESK COLLECTION (COMBINATIONS OF TWO & THREE) ── */}
      <section id="office-desk-collection" className="py-24 lg:py-32 bg-brand-cream border-t border-warmgrey/50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold block mb-3">
              Curated Suites &amp; Gift Sets • 10% to 15% Off
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green leading-tight">
              Office Desk
              <br />
              <span className="italic font-normal text-brand-brown">Collection</span>
            </h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-6 mb-6" />
            <p className="text-sm sm:text-base text-charcoal/75 leading-relaxed">
              Thoughtfully curated pairs and trios of Kashmir pine essentials — designed as complete workstation ecosystems and distinguished heirloom gift sets.
              Enjoy an automatic <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">10% off Duos</span> and <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">15% off Trios</span> for a harmonized, productive workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {featuredHomeBundles.map((bundle) => {
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
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 50vw"
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
                  <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between gap-5">
                    <div>
                      <div className="mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md inline-block">
                          {isTrio ? "15% Price Reduction" : "10% Price Reduction"}
                        </span>
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-green group-hover:text-brand-brown transition-colors leading-snug">
                        {bundle.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed mt-2 line-clamp-2">
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

          {/* View All Combos CTA */}
          <div className="text-center mt-14">
            <Link href="/shop#combos">
              <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All Office Desk Combos (7 Sets)
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* ── 6. CRAFTSMANSHIP PROCESS ──────────────────────── */}
      <section
        id="process"
        className="py-24 lg:py-32 bg-brand-green text-brand-cream border-t border-brand-green-light/30"
      >
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold block mb-3">
              Meticulous Steps
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand-cream leading-tight">
              The Art of
              <br />
              <span className="italic font-normal text-brand-gold">Kashmir Woodcraft</span>
            </h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-6 mb-6" />
            <p className="text-sm text-brand-cream/70 leading-relaxed">
              No hurried factories or automated presses. Here is how your desk
              accessory comes to life:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              {
                step: "01",
                title: "Salvaged Harvest",
                desc: "We patrol natural forest groves for wind-fallen branches and retired trees, honoring the valley ecosystem.",
              },
              {
                step: "02",
                title: "Hand Profiling",
                desc: "Artisans slice and join pieces with precision joinery, respecting the inherent direction of grain and natural knots.",
              },
              {
                step: "03",
                title: "Organic Texture & Finish",
                desc: "Hand-finished to celebrate the pine's natural grain ripples, tactile character, and living mountain rawness — preserving authentic wood character over artificial uniformity.",
              },
              {
                step: "04",
                title: "Custom Products",
                desc: "Custom products accepted and tailored to your workspace specifications, alongside our signature catalog pieces.",
              },
            ].map((item, i) => (
              <div key={i} className="relative pl-6 border-l border-brand-gold/30">
                <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-brand-gold text-charcoal text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="font-display text-4xl font-bold text-brand-gold/20 block -mt-1 mb-2">
                  {item.step}
                </span>
                <h3 className="font-display text-xl font-bold text-brand-cream mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-brand-cream/65 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 7. JOURNEY — cinematic video + photo wall ─────── */}
      <section className="bg-brand-cream border-t border-warmgrey/50">

        {/* 7a. Full-width video hero */}
        <div className="relative overflow-hidden" style={{ minHeight: "min(680px, 90vh)" }}>
          {/* Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-0 w-full h-full object-cover"
            poster="https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-2.jpeg"
          >
            <source src="https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/videos/brand_video1.mp4" type="video/mp4" />
          </video>

          {/* Overlays — dark vignette, stronger at bottom so text pops */}
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/30 via-transparent to-charcoal/10" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-end h-full text-center px-4 sm:px-6"
               style={{ minHeight: "min(680px, 90vh)", paddingBottom: "4rem" }}>

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="block w-8 h-px bg-brand-gold/70" />
              <span className="text-brand-gold text-[11px] font-black uppercase tracking-[0.18em]">
                Behind The Workshop
              </span>
              <span className="block w-8 h-px bg-brand-gold/70" />
            </div>

            {/* Headline */}
            <h2 className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-none tracking-tight mb-4">
              DRIDHA
              <br />
              <span className="font-display italic font-light text-brand-gold tracking-wider">
                CRAFTS
              </span>
            </h2>

            {/* Divider */}
            <div className="flex items-center gap-4 my-4">
              <div className="w-16 h-px bg-brand-gold/50" />
              <span className="text-brand-gold text-sm">✦</span>
              <div className="w-16 h-px bg-brand-gold/50" />
            </div>

            {/* Tagline */}
            <p className="font-heading text-lg sm:text-xl lg:text-2xl italic text-brand-cream/85 mb-2">
              Where Ancient Pine Meets Modern Desks
            </p>
            <p className="font-body text-xs text-white/50 tracking-widest uppercase mb-8">
              Zero Deforestation · Pure Artisan Craft · Pan-India Delivery
            </p>

            {/* Subtext */}
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              See raw pine being chiseled, woodworkers sharing their stories,
              and real customer desk setups.
            </p>
          </div>
        </div>

        {/* 7b. Social Media Hub & Community */}
        <div className="py-20 lg:py-28 bg-[#102a1e] border-t border-white/10">
          <Container>
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold bg-brand-gold/10 px-4 py-1.5 rounded-full border border-brand-gold/30 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                Follow Our Journey
              </span>
              <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Behind the Chisel & the Himalayan Pine
              </h3>
              <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                Step inside our Kashmir workshop. Follow along on whichever channel you use regularly — or better yet, subscribe across all three so you never miss a daily carving reel, artisan documentary, or exclusive drop.
              </p>
            </div>

            {/* 3 Prominent Channel Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
              {/* YouTube */}
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <YouTubeIcon className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                      YouTube
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                    @dridha_crafts
                  </h4>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6">
                    Full artisan mini-documentaries, fallen pine foraging in Gulmarg, and step-by-step woodworking processes.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400 group-hover:gap-3 transition-all">
                  <span>Subscribe on YouTube</span>
                  <span>↗</span>
                </div>
              </a>

              {/* Instagram */}
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-gold/60 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                      <InstagramIcon className="w-6 h-6 stroke-current" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/25">
                      Instagram
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-white mb-1 group-hover:text-brand-gold transition-colors">
                    @dridha_crafts
                  </h4>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6">
                    Daily reels from the carving bench, natural polish tests, workshop stories, and desk setup inspiration.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold group-hover:gap-3 transition-all">
                  <span>Follow on Instagram</span>
                  <span>↗</span>
                </div>
              </a>

              {/* Facebook */}
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FacebookIcon className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      Facebook
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    Dridha Crafts
                  </h4>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6">
                    Community discussions, customer workspace reviews, batch launch announcements, and craft events.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 group-hover:gap-3 transition-all">
                  <span>Connect on Facebook</span>
                  <span>↗</span>
                </div>
              </a>
            </div>

            {/* Curated Social Feed Grid with Direct Embedded Links */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">
                    Latest From Our Feeds
                  </h4>
                  <p className="text-xs text-white/50">Click any card to watch, like, and follow</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-brand-gold">
                  <span>#DridhaCrafts</span>
                  <span className="text-white/30">·</span>
                  <span>#KashmirWoodwork</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {[
                  {
                    src: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/brand_img1.jpeg",
                    platform: "Instagram",
                    type: "Reel",
                    caption: "Hand-chiseling the ShiftDesk stand",
                    href: SOCIAL_LINKS.instagram,
                    icon: InstagramIcon,
                    accent: "border-brand-gold/40 text-brand-gold",
                  },
                  {
                    src: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/brand_img2.jpeg",
                    platform: "YouTube",
                    type: "Video",
                    caption: "The zero-deforestation pledge in Kashmir",
                    href: SOCIAL_LINKS.youtube,
                    icon: YouTubeIcon,
                    accent: "border-red-500/40 text-red-400",
                  },
                  {
                    src: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/brand_img3.jpeg",
                    platform: "Instagram",
                    type: "Story",
                    caption: "Artisan hands smoothing through 6 grits",
                    href: SOCIAL_LINKS.instagram,
                    icon: InstagramIcon,
                    accent: "border-brand-gold/40 text-brand-gold",
                  },
                  {
                    src: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/brand_img4.jpeg",
                    platform: "Facebook",
                    type: "Community",
                    caption: "Customer desk transformation with wooden riser",
                    href: SOCIAL_LINKS.facebook,
                    icon: FacebookIcon,
                    accent: "border-blue-500/40 text-blue-400",
                  },
                  {
                    src: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/brand_img5.jpeg",
                    platform: "YouTube",
                    type: "Short",
                    caption: "Testing natural wax polish in sunlight",
                    href: SOCIAL_LINKS.youtube,
                    icon: YouTubeIcon,
                    accent: "border-red-500/40 text-red-400",
                  },
                  {
                    src: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/brand_img6.jpeg",
                    platform: "Instagram",
                    type: "Photo",
                    caption: "Hand-stamping the artisan thank-you seal",
                    href: SOCIAL_LINKS.instagram,
                    icon: InstagramIcon,
                    accent: "border-brand-gold/40 text-brand-gold",
                  },
                ].map((item, i) => (
                  <a
                    key={i}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-2xl bg-warmgrey/20 border border-white/10 hover:border-white/40 transition-all duration-300 cursor-pointer shadow-soft hover:shadow-elevated block"
                  >
                    <Image
                      src={item.src}
                      alt={item.caption}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                    {/* Top Platform Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm border ${item.accent}`}>
                        <item.icon className="w-2.5 h-2.5" />
                        {item.type}
                      </span>
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-left">
                      <p className="text-[11px] text-white/90 line-clamp-2 leading-tight font-medium mb-2">
                        {item.caption}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                        Open on {item.platform} ↗
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick-Follow All Channels Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-6 border-t border-white/10">
              <span className="text-xs uppercase tracking-wider text-white/50 w-full sm:w-auto text-center">
                Follow & Subscribe:
              </span>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-600 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
              >
                <YouTubeIcon className="w-4 h-4 fill-current text-red-500 group-hover:text-white" />
                YouTube @dridha_crafts
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-gold/20 hover:bg-brand-gold hover:text-charcoal border border-brand-gold/40 text-brand-gold text-xs font-semibold tracking-wide transition-all shadow-sm"
              >
                <InstagramIcon className="w-4 h-4" />
                Instagram @dridha_crafts
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-600 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
              >
                <FacebookIcon className="w-4 h-4 fill-current text-blue-400 group-hover:text-white" />
                Facebook Dridha Crafts
              </a>
            </div>
          </Container>
        </div>
      </section>

      {/* ── 8. TRUST STRIP ────────────────────────────────── */}
      <section className="py-14 bg-charcoal text-brand-cream border-t border-white/5">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "100%", label: "Naturally Fallen Wood", icon: "🌲" },
              { value: "Zero", label: "Plastic in Packaging", icon: "♻️" },
              { value: "Direct", label: "Pan-India Delivery", icon: "🚚" },
              { value: "UPI", label: "Safe UPI Payment via WhatsApp", icon: "📱" },
            ].map((trust, i) => (
              <div key={i} className="space-y-2">
                <span className="text-3xl block">{trust.icon}</span>
                <p className="font-display text-2xl font-bold text-brand-gold">{trust.value}</p>
                <p className="text-xs text-brand-cream/60 uppercase tracking-wide">{trust.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
