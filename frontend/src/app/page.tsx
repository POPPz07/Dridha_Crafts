"use client";

import { useState } from "react";
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

// Custom Instagram SVG icon (not in this lucide-react version)
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
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRODUCTS_DATA, BUNDLES_DATA, StaticProduct } from "@/lib/products-data";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const categories = [
    "All",
    "Laptop Stands",
    "Audio Accessories",
    "Desk Organizers",
    "Phone Stands",
    "Desk Decor",
  ];

  const filteredProducts =
    selectedCategory === "All"
      ? PRODUCTS_DATA
      : PRODUCTS_DATA.filter((p) => p.category === selectedCategory);

  const handleAddToCart = (product: StaticProduct) => {
    addItem({
      id: `${product.id}-default`,
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
                img: "/images/image11.png",
                imgAlt: "Raw walnut grain timber",
              },
              {
                num: "02",
                title: "The Master's Hands",
                desc: "Generations of woodworkers in Kashmir carry an unspoken dialogue with timber. Using traditional gouges and chisels, each desk accessory is hand-shaped, sanded through six grits, and oiled with natural wax.",
                img: "/images/image9.jpeg",
                imgAlt: "Handcrafted Kashmir woodwork",
              },
              {
                num: "03",
                title: "Your Thoughtful Workspace",
                desc: "Technology is sterile and plastic. Dridha Crafts brings tactile soul back to your workspace. A gentle touch of organic wood that elevates your mindset every time you sit down to create.",
                img: "/images/image2.jpeg",
                imgAlt: "Premium wooden desk workspace",
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
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Image */}
              <div className="md:col-span-5 relative aspect-[4/3] md:aspect-auto min-h-[280px] overflow-hidden">
                <Image
                  src="/images/gift-card.jpg"
                  alt="Dridha Crafts Packaging Thank You Card"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-brand-cream/20" />
              </div>
              {/* Content */}
              <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-4">
                <Badge variant="handcrafted">Our Packaging Promise</Badge>
                <h3 className="font-display text-3xl sm:text-4xl font-bold text-brand-green leading-tight">
                  "Thank You for Being a Part of Our Journey"
                </h3>
                <p className="font-body text-base text-charcoal/80 leading-relaxed italic border-l-2 border-brand-gold pl-4">
                  "Every piece we create is a blend of nature, tradition and skilled hands.
                  From the forests of Kashmir to your desk, we bring you handcrafted wood
                  essentials — made to last."
                </p>
                <p className="font-accent text-brand-brown text-2xl">
                  Crafted with care, just for you.
                </p>
                <p className="text-xs text-charcoal/50 pt-2">
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

      {/* ── 5. BUNDLES ────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-brand-cream border-t border-warmgrey/50">
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold block mb-3">
              Complete Desk Harmonization
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green leading-tight">
              Work From Home
              <br />
              <span className="italic font-normal text-brand-brown">Bundles</span>
            </h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-6 mb-6" />
            <p className="text-sm text-charcoal/70 leading-relaxed">
              Curated desk essentials bundled for ergonomic synchronicity —
              packaged together to save you up to ₹200.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BUNDLES_DATA.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white rounded-3xl overflow-hidden border border-warmgrey/80 shadow-soft hover:shadow-elevated transition-all duration-500 flex flex-col"
              >
                {/* Bundle Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-warmgrey/20">
                  <Image
                    src={bundle.image}
                    alt={bundle.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <Badge variant="bestseller">{bundle.badge}</Badge>
                    <span className="text-xs font-bold text-sage bg-white px-2.5 py-1 rounded-full shadow-sm border border-sage/20">
                      Save ₹{bundle.savings}
                    </span>
                  </div>
                </div>

                {/* Bundle Content */}
                <div className="p-8 flex flex-col flex-1 justify-between gap-6">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-brand-green mb-2">
                      {bundle.name}
                    </h3>
                    <p className="text-xs text-charcoal/70 leading-relaxed mb-5">
                      {bundle.description}
                    </p>
                    <ul className="space-y-2 pt-4 border-t border-warmgrey/60 text-xs text-charcoal/80">
                      {bundle.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-warmgrey/70">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="font-display text-3xl font-bold text-brand-green">
                        {formatPrice(bundle.price)}
                      </span>
                      <span className="text-xs text-charcoal/40 line-through">
                        {formatPrice(bundle.original_price)}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        addItem({
                          id: `${bundle.id}-bundle`,
                          product_id: bundle.id,
                          variant_id: null,
                          quantity: 1,
                          product: {
                            name: bundle.name,
                            slug: bundle.slug,
                            price: bundle.price,
                            primary_image_url: bundle.image,
                            stock_quantity: 10,
                          },
                          variant: null,
                        });
                        openCart();
                      }}
                    >
                      Get This Bundle
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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

        {/* 7b. Photo grid + CTA */}
        <div className="py-16 lg:py-20">
          <Container>
            {/* Grid label */}
            <div className="text-center mb-10">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold block mb-2">
                Follow Our Journey
              </span>
              <div className="w-10 h-0.5 bg-brand-gold mx-auto" />
            </div>

            {/* Instagram Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
              {[
                "/images/brand_img1.jpeg",
                "/images/brand_img2.jpeg",
                "/images/brand_img3.jpeg",
                "/images/brand_img4.jpeg",
                "/images/brand_img5.jpeg",
                "/images/brand_img6.jpeg",
              ].map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-warmgrey/30 group cursor-pointer"
                >
                  <Image
                    src={src}
                    alt={`Dridha Crafts Instagram ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-brand-green/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <InstagramIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <a
                href="https://instagram.com/dridhacrafts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-brand-green text-white rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-brand-green-light transition-all duration-300 shadow-medium hover:shadow-elevated"
              >
                <InstagramIcon className="w-5 h-5" />
                Follow @dridhacrafts on Instagram
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
