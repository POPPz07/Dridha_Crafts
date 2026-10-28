import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles, Shield, Heart } from "lucide-react";

export const metadata = {
  title: "Our Story — Handcrafted in Kashmir Valley",
  description:
    "Learn about our journey: from naturally fallen Kashmiri walnut trees and generational craftsmen to mindful, ergonomic modern desk accessories.",
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
                  src="/images/image11.png"
                  alt="Kashmiri Walnut Wood Grain"
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
                  Kashmiri walnut trees are centuries-old sentinels of the Pir Panjal mountains. We have made a strict
                  pledge: not a single healthy tree is felled for our crafts.
                </p>
                <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                  Instead, we salvage naturally wind-fallen branches, snow-weighted limbs, and timber retired by orchardists.
                  The wood has spent decades maturing in mountain air, resulting in unmatched density, grain contrast, and resilience.
                </p>
              </div>
            </div>

            {/* Story Card 2: The Craftsmen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-8 sm:p-12 border border-warmgrey/80 shadow-soft">
              <div className="lg:col-span-6 lg:order-2 relative aspect-[4/3] rounded-2xl overflow-hidden bg-warmgrey/30">
                <Image
                  src="/images/image9.jpeg"
                  alt="Generational Wood Carvers"
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
                  src="/images/gift-card.jpg"
                  alt="Crafted With Care Just For You"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
                  Chapter III • To Your Workspace
                </span>
                <h2 className="font-display text-3xl font-bold text-brand-green">
                  Crafted With Care, Just For You
                </h2>
                <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                  From our workshop in Kashmir, finished pieces arrive in Pune for rigorous inspection, gentle wax coating,
                  and eco-friendly packaging. Every parcel is dispatched with our signed gratitude card and artisan stamp.
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
