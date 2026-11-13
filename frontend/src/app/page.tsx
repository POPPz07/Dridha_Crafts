"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShoppingBag,
  Heart,
  ChevronDown,
} from "lucide-react";
import { ImageHero } from "@/components/sections/ImageHero";
import { MaterialSection } from "@/components/sections/MaterialSection";
import { ShiftDesk3DSection } from "@/components/sections/ShiftDesk3DSection";
import { MobileStand3DSection } from "@/components/sections/MobileStand3DSection";
import { TabletStand3DSection } from "@/components/sections/TabletStand3DSection";
import { CustomCaddy3DSection } from "@/components/sections/CustomCaddy3DSection";

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

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

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
              { icon: "🌲", text: "Zero Deforestation", sub: "Fallen Trees Only" },
              { icon: "✋", text: "Generational Craft", sub: "Kashmir Heritage" },
              { icon: "📦", text: "Pune QA & Dispatch", sub: "Individually Inspected" },
              { icon: "✨", text: "Free Pan-India", sub: "Delivery Nationwide" },
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
          <div className="max-w-3xl mx-auto text-center mb-20" data-animate="fade-up">
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
              In the heart of the Kashmir Valley, nature commands patience. Ancient walnut
              trees yield aged wood naturally. We gather what nature has surrendered —
              breathing new life into every contour.
            </p>
          </div>

          {/* Story Chapter Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20" data-animate="stagger">
            {[
              {
                num: "01",
                title: "The Salvaged Timber",
                desc: "We maintain a strict zero-felling policy. Every grain tells a story of mountain winters, meltwater rivers, and Himalayan winds. The wood cures naturally before it ever touches a tool.",
                img: "/images/sd-2.jpeg",
                imgAlt: "ShiftDesk Stand crafted from aged Himalayan timber",
              },
              {
                num: "02",
                title: "The Master's Hands",
                desc: "Generations of woodworkers in Kashmir carry an unspoken dialogue with timber. Using traditional gouges and chisels, each desk accessory is hand-shaped, sanded through six grits, and oiled with natural wax.",
                img: "/images/h-1.png",
                imgAlt: "Artisan sculpted Solid Wood Headphone Stand",
              },
              {
                num: "03",
                title: "Your Thoughtful Workspace",
                desc: "Technology is sterile and plastic. Dridha Crafts brings tactile soul back to your workspace. A gentle touch of organic wood that elevates your mindset every time you sit down to create.",
                img: "/images/ls-6.png",
                imgAlt: "Handcrafted Multi-Angle Laptop Stand workspace setup",
              },
            ].map((chapter, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl overflow-hidden border border-warmgrey/70 shadow-soft hover:shadow-elevated transition-all duration-500 group"
                data-animate="stagger-child"
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
                    src="/images/gift-card.jpg"
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
                <Badge variant="handcrafted">Our Packaging Promise</Badge>
                <h3 className="font-display text-3xl sm:text-4xl font-bold text-brand-green leading-tight">
                  The Living Character of Handcrafted Wood
                </h3>
                <div className="space-y-3 font-body text-base text-charcoal/80 leading-relaxed">
                  <p>
                    When you unbox your Dridha Crafts piece, you may notice subtle
                    uneven surfaces, organic grain ripples, or a gentle touch of natural
                    rawness. These are not defects — they are the honest hallmarks of
                    authentic mountain timber.
                  </p>
                  <p>
                    Every piece is shaped by Kashmiri artisan hands directly from
                    naturally fallen trees, carving what the valley has surrendered
                    into the finest functional craft possible. That tactile rawness and
                    natural imperfection is what gives each item its soul: bringing the
                    living warmth and character of Kashmir pine to work beside you every
                    day, responsibly created without contributing to deforestation.
                  </p>
                </div>
                <p className="font-accent text-brand-brown text-2xl pt-1">
                  Crafted with care, just for you.
                </p>
                <p className="text-xs text-charcoal/50 pt-2 border-t border-warmgrey/50">
                  Every Dridha Crafts order includes a personalized hand-stamped
                  thank-you note and authentic artisan seal.
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

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-brand-green text-white shadow-soft"
                      : "bg-brand-cream text-charcoal/70 hover:bg-warmgrey border border-warmgrey"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" data-animate="stagger">
            {filteredProducts.map((product) => {
              const isHovered = hoveredProduct === product.id;
              const hasAlternate = product.images.length > 1;
              const currentImage =
                isHovered && hasAlternate ? product.images[1] : product.images[0];
              const isAdded = quickAddedId === product.id;
              const inWishlist = isInWishlist(product.id);

              return (
                <div
                  key={product.id}
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  className="group bg-brand-cream rounded-3xl overflow-hidden border border-warmgrey/70 hover:border-brand-gold/60 transition-all duration-500 hover:shadow-elevated flex flex-col"
                  data-animate="stagger-child"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-warmgrey/20">
                    <Image
                      src={currentImage?.url || "/images/image1.jpeg"}
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
                      onClick={() => toggleWishlist(product.id)}
                      className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
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
                  <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-1">
                        {product.wood_type} · {product.category}
                      </p>
                      <h3 className="font-display text-xl font-bold text-brand-green group-hover:text-brand-brown transition-colors leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-charcoal/65 line-clamp-2 mt-2 leading-relaxed">
                        {product.short_description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-warmgrey/60 flex items-center justify-between gap-3">
                      <div>
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
                      </div>

                      <Button
                        variant={isAdded ? "gold" : "primary"}
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="shrink-0"
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
                      className="block text-center text-xs text-charcoal/50 hover:text-brand-green transition-colors mt-2 underline-offset-2 hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All CTA */}
          <div className="text-center mt-14">
            <Link href="/shop">
              <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Full Collection
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* ── 4b. 3D INTERACTIVE FORM STUDIES ────────────────── */}
      <ShiftDesk3DSection />
      <MobileStand3DSection />
      <TabletStand3DSection />
      <CustomCaddy3DSection />

      {/* ── 5. OFFICE DESK COLLECTION (COMBINATIONS OF TWO) ── */}
      <section id="office-desk-collection" className="py-24 lg:py-32 bg-brand-cream border-t border-warmgrey/50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold block mb-3">
              Special Duo Discount • 10% Off
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green leading-tight">
              Office Desk
              <br />
              <span className="italic font-normal text-brand-brown">Collection</span>
            </h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-6 mb-6" />
            <p className="text-sm sm:text-base text-charcoal/75 leading-relaxed">
              Curated pairs of handcrafted Kashmir timber essentials.
              Enjoy an automatic <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">10% price reduction</span> on these complementary combinations of two.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {BUNDLES_DATA.map((bundle) => {
              const isAdded = quickAddedBundleId === bundle.id;

              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-3xl overflow-hidden border border-warmgrey/80 shadow-soft hover:shadow-elevated transition-all duration-500 flex flex-col justify-between group"
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
                        Save 10% (₹{bundle.savings})
                      </span>
                    </div>

                    {/* Dual item pills at bottom of image */}
                    {bundle.item_images && bundle.item_images.length === 2 && (
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-xs border border-warmgrey/60 flex items-center gap-1.5 pointer-events-none">
                        <div className="relative w-6 h-6 rounded-md overflow-hidden bg-warmgrey/30">
                          <Image src={bundle.item_images[0]} alt="Item 1" fill className="object-cover" sizes="24px" />
                        </div>
                        <span className="text-[11px] font-bold text-brand-gold">+</span>
                        <div className="relative w-6 h-6 rounded-md overflow-hidden bg-warmgrey/30">
                          <Image src={bundle.item_images[1]} alt="Item 2" fill className="object-cover" sizes="24px" />
                        </div>
                        <span className="text-[10px] font-bold text-brand-green ml-0.5 uppercase tracking-wide">Duo</span>
                      </div>
                    )}
                  </div>

                  {/* Bundle Content */}
                  <div className="p-6 flex flex-col flex-1 justify-between gap-5">
                    <div>
                      <div className="mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md inline-block">
                          10% Price Reduction
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
                          <span className="text-[10px] font-bold text-emerald-700">
                            Save ₹{bundle.savings} (10% OFF)
                          </span>
                        </div>
                      </div>

                      <Button
                        variant={isAdded ? "gold" : "primary"}
                        className="w-full"
                        size="sm"
                        onClick={() => handleAddToCartBundle(bundle)}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" /> Added to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Add Duo to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                desc: "We patrol natural walnut groves for wind-fallen branches and retired trees, honoring the valley ecosystem.",
              },
              {
                step: "02",
                title: "Hand Profiling",
                desc: "Artisans slice and join pieces with precision joinery, respecting the inherent direction of grain and natural knots.",
              },
              {
                step: "03",
                title: "Multi-Grit Polish",
                desc: "Hand-sanded up to 600 grit to achieve an ultra-smooth touch that feels organic, silky, and warm.",
              },
              {
                step: "04",
                title: "Pune QA & Ship",
                desc: "Consignments arrive in Pune for individual inspection, 5-ply box packing with kraft paper, and prompt dispatch.",
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
            className="absolute inset-0 w-full h-full object-cover"
            poster="/images/image1.jpeg"
          >
            <source src="/videos/brand_video1.mp4" type="video/mp4" />
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
              Where Ancient Timber Meets Modern Desks
            </p>
            <p className="font-body text-xs text-white/50 tracking-widest uppercase mb-8">
              Zero Deforestation · Pure Artisan Craft · Free Pan-India Delivery
            </p>

            {/* Subtext */}
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              See raw timber being chiseled, woodworkers sharing their stories,
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
                    Full artisan mini-documentaries, fallen timber foraging in Gulmarg, and step-by-step woodworking processes.
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
                    src: "/images/brand_img1.jpeg",
                    platform: "Instagram",
                    type: "Reel",
                    caption: "Hand-chiseling the ShiftDesk stand",
                    href: SOCIAL_LINKS.instagram,
                    icon: InstagramIcon,
                    accent: "border-brand-gold/40 text-brand-gold",
                  },
                  {
                    src: "/images/brand_img2.jpeg",
                    platform: "YouTube",
                    type: "Video",
                    caption: "The zero-deforestation pledge in Kashmir",
                    href: SOCIAL_LINKS.youtube,
                    icon: YouTubeIcon,
                    accent: "border-red-500/40 text-red-400",
                  },
                  {
                    src: "/images/brand_img3.jpeg",
                    platform: "Instagram",
                    type: "Story",
                    caption: "Artisan hands smoothing through 6 grits",
                    href: SOCIAL_LINKS.instagram,
                    icon: InstagramIcon,
                    accent: "border-brand-gold/40 text-brand-gold",
                  },
                  {
                    src: "/images/brand_img4.jpeg",
                    platform: "Facebook",
                    type: "Community",
                    caption: "Customer desk transformation with walnut riser",
                    href: SOCIAL_LINKS.facebook,
                    icon: FacebookIcon,
                    accent: "border-blue-500/40 text-blue-400",
                  },
                  {
                    src: "/images/brand_img5.jpeg",
                    platform: "YouTube",
                    type: "Short",
                    caption: "Testing natural wax polish in sunlight",
                    href: SOCIAL_LINKS.youtube,
                    icon: YouTubeIcon,
                    accent: "border-red-500/40 text-red-400",
                  },
                  {
                    src: "/images/brand_img6.jpeg",
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
              { value: "Free", label: "Pan-India Delivery", icon: "🚚" },
              { value: "COD", label: "Cash On Delivery & GPay", icon: "💳" },
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
