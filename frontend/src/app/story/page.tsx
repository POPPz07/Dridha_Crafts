import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles, Shield, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Story — Handcrafted in Kashmir Valley | Dridha Crafts",
  description:
    "Learn about our journey: from naturally fallen mountain pine trees and generational craftsmen to mindful, ergonomic modern desk accessories.",
  alternates: {
    canonical: "https://www.dridhacrafts.co.in/story",
  },
  openGraph: {
    title: "Our Story — Handcrafted in Kashmir Valley | Dridha Crafts",
    description:
      "Learn about our journey: from naturally fallen mountain pine trees and generational craftsmen to mindful, ergonomic modern desk accessories.",
    url: "https://www.dridhacrafts.co.in/story",
    siteName: "Dridha Crafts",
    type: "website",
    images: [
      {
        url: "https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-2.jpeg",
        width: 1200,
        height: 630,
        alt: "Dridha Crafts Artisan Story — Kashmir Pine Wood",
      },
    ],
  },
};

export default function StoryPage() {
  return (
    <main className="min-h-screen pt-28 pb-16 bg-brand-cream">
      {/* Hero */}
      <section className="relative overflow-hidden pb-16">
        <Container size="narrow" className="text-center space-y-4">
          <Badge variant="handcrafted">Heritage & Sustainability</Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green leading-[1.1]">
            Honoring Fallen Trees, Empowering Kashmiri Hands.
          </h1>
          <p className="font-body text-base sm:text-lg text-charcoal/80 leading-relaxed pt-2">
            In an era of disposable plastic and mass manufacture, Dridha Crafts was born out of a quiet reverence
            for natural wood and the generational masters of Kashmir.
          </p>
        </Container>
      </section>

      {/* Origin Narrative Sections */}
      <section className="py-12">
        <Container>
          <div className="space-y-20">
            {/* Story Card 1: The Sanctuary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-8 sm:p-12 border border-warmgrey/80 shadow-soft">
              <div className="lg:col-span-6 relative aspect-[4/3] rounded-2xl overflow-hidden bg-warmgrey/30">
                <Image
                  src="https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/sd-2.jpeg"
                  alt="ShiftDesk Stand crafted from seasoned mountain pine"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
                  Chapter I • Zero Felling
                </span>
                <h2 className="font-display text-3xl font-bold text-brand-green">
                  Never Cut Down. Only Given by Nature.
                </h2>
                <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                  Ancient mountain trees are centuries-old sentinels of the Pir Panjal mountains. We have made a strict
                  pledge: not a single healthy tree is felled for our crafts.
                </p>
                <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                  Instead, we salvage naturally wind-fallen branches, snow-weighted limbs, and pine retired by orchardists.
                  The wood has spent decades maturing in mountain air, resulting in unmatched density, grain contrast, and resilience.
                </p>
              </div>
            </div>

            {/* Story Card 2: The Craftsmen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-8 sm:p-12 border border-warmgrey/80 shadow-soft">
              <div className="lg:col-span-6 lg:order-2 relative aspect-[4/3] rounded-2xl overflow-hidden bg-warmgrey/30">
                <Image
                  src="https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/h-1.png"
                  alt="Artisan sculpted Dropzone Headphone Stand"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="lg:col-span-6 lg:order-1 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
                  Chapter II • Generational Pride
                </span>
                <h2 className="font-display text-3xl font-bold text-brand-green">
                  Master Artisans of the Valley
                </h2>
                <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                  For centuries, Kashmiri woodworkers were famous for royal palaces and intricate shrines. Yet in recent
                  decades, market shifts left many workshops struggling to reach contemporary buyers.
                </p>
                <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                  Dridha Crafts bridges this divide. We combine modern ergonomic proportions with traditional hand carving.
                  By paying fixed, dignified artisan rates and showcasing their skill directly across India, we ensure this heritage lives on.
                </p>
              </div>
            </div>

            {/* Story Card 3: The Desk Connection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-8 sm:p-12 border border-warmgrey/80 shadow-soft">
              <div className="lg:col-span-6 relative aspect-[4/3] rounded-2xl overflow-hidden bg-warmgrey/30">
                <Image
                  src="https://gortltkzskcsvucfouxd.supabase.co/storage/v1/object/public/products/images/ls-1.jpg"
                  alt="Handcrafted Multi-Angle Laptop Stand on workspace desk"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
                  Chapter III • To Your Workspace & Meaningful Gifting
                </span>
                <h2 className="font-display text-3xl font-bold text-brand-green">
                  Crafted With Care, Designed to Gift
                </h2>
                <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                  From our atelier in Kashmir, every piece undergoes meticulous smoothing through six grits, natural organic oil polishing, and protective transit packing. Whether chosen as a single piece, a complete workstation suite, or commissioned through bespoke dimensions subject to artisan feasibility — every parcel carries our signed gratitude card and authentic artisan seal.
                </p>
                <p className="font-accent text-brand-brown text-2xl pt-2">
                  "Every piece we create is a blend of nature, tradition and skilled hands."
                </p>
                <div className="pt-2">
                  <Link href="/shop">
                    <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Explore Our Desk Collection
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
