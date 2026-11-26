import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Truck, RefreshCw, Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Dridha Crafts",
  description:
    "Review the terms, conditions, handcrafted wood policies, shipping terms, and replacement guidelines for Dridha Crafts products.",
  alternates: {
    canonical: "https://www.dridhacrafts.co.in/terms",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "November 26, 2026";

  return (
    <main className="min-h-screen pt-28 pb-20 bg-brand-cream">
      {/* Header */}
      <section className="relative overflow-hidden pb-12 border-b border-warmgrey/60">
        <Container size="narrow" className="text-center space-y-4">
          <Badge variant="handcrafted">Customer Agreement</Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-green tracking-tight">
            Terms of Service
          </h1>
          <p className="font-body text-sm sm:text-base text-charcoal/70 max-w-xl mx-auto">
            Clear, transparent policies for handcrafted desk accessories, shipping across India, and bespoke commissions.
          </p>
          <p className="text-xs uppercase tracking-widest text-brand-brown/70 font-semibold pt-2">
            Last Updated: {lastUpdated}
          </p>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <Container size="narrow">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-warmgrey/80 shadow-soft space-y-10 text-charcoal/80 leading-relaxed font-body">

            {/* 1. Overview */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">1</span>
                Agreement to Terms
              </h2>
              <p className="text-sm">
                By accessing or purchasing from <strong>Dridha Crafts</strong> (accessible via{" "}
                <Link href="/" className="text-brand-green font-semibold underline hover:text-brand-brown">
                  https://www.dridhacrafts.co.in
                </Link>
                ), you agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from using the platform.
              </p>
            </div>

            {/* 2. Nature of Handcrafted Woodcraft */}
            <div className="space-y-4 p-6 bg-brand-cream/40 rounded-2xl border border-warmgrey/70">
              <h2 className="font-display text-xl font-bold text-brand-green flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-gold" />
                The Authentic Character of Living Mountain Pine
              </h2>
              <p className="text-sm">
                Every Dridha Crafts accessory is individually hand-shaped by artisans in the Kashmir Valley from naturally fallen mountain pine trees. Because we honor natural wood:
              </p>
              <ul className="space-y-2 text-sm list-disc pl-5">
                <li>
                  <strong>Grain, Tone & Knot Variations:</strong> Subtle color gradations, grain whorls, natural knots, and tactile organic contours are authentic characteristics of solid seasoned wood. They are signatures of artisanal uniqueness, not defects.
                </li>
                <li>
                  <strong>Hand-Chiseled Proportions:</strong> While our dimensions are precision-calibrated for modern laptops, tablets, and phones, minor millimeter variations arise from hand-planing and multi-grit sanding.
                </li>
              </ul>
            </div>

            {/* 3. Orders & Pricing */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">2</span>
                Orders &amp; Transparent Pricing
              </h2>
              <ul className="space-y-2 text-sm list-disc pl-5">
                <li>All prices listed on Dridha Crafts are in <strong>Indian Rupees (INR)</strong> and inclusive of applicable taxes.</li>
                <li>Delivery charges are transparently calculated at checkout based on the products ordered (e.g. ₹19 subsidized delivery for mobile stand, ₹99 for larger wooden stands, and free delivery on featured combinations).</li>
                <li>We reserve the right to cancel or decline orders in cases of pricing typographical errors or inability to contact the customer for shipping confirmation.</li>
              </ul>
            </div>

            {/* 4. Bespoke & Custom Commissions */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">3</span>
                Bespoke &amp; Custom Artisan Commissions
              </h2>
              <p className="text-sm">
                For customized workstation pieces (such as bespoke caddies, specific dimension risers, or personalized laser engravings):
              </p>
              <ul className="space-y-2 text-sm list-disc pl-5">
                <li>
                  <strong>Artisan Feasibility Check:</strong> Every custom inquiry is evaluated for structural stability with natural pine wood before payment is accepted.
                </li>
                <li>
                  <strong>Finalized Order Locking:</strong> Once dimensions and design are confirmed over official WhatsApp chat and paid for, customized items cannot be modified or canceled as crafting begins immediately.
                </li>
              </ul>
            </div>

            {/* 5. Pan-India Shipping Policy */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <Truck className="w-6 h-6 text-brand-gold" />
                Shipping &amp; Delivery Terms
              </h2>
              <ul className="space-y-2 text-sm list-disc pl-5">
                <li>
                  <strong>Dispatch Timeline:</strong> Every item is given a final inspection and oil polish before dispatch within <strong>2 to 3 business days</strong> from our Kashmir atelier.
                </li>
                <li>
                  <strong>Delivery Estimate:</strong> Pan-India shipping typically reaches destinations within <strong>4 to 7 business days</strong> depending on your PIN code.
                </li>
                <li>
                  <strong>Tracking:</strong> You will receive a tracking link via email/SMS as soon as the logistics partner scans your parcel.
                </li>
              </ul>
            </div>

            {/* 6. Replacements & Transit Damage Guarantee */}
            <div className="space-y-3 p-6 bg-brand-cream/40 rounded-2xl border border-warmgrey/70">
              <h2 className="font-display text-xl font-bold text-brand-green flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-brand-gold" />
                7-Day Transit Damage &amp; Replacement Policy
              </h2>
              <p className="text-sm">
                We pack every wooden creation in protective shock-resistant cushioning. However, if your order arrives damaged during transit:
              </p>
              <ul className="space-y-2 text-sm list-disc pl-5">
                <li>
                  Notify us within <strong>7 days of delivery</strong> at <a href="mailto:craftsdridha@gmail.com" className="font-semibold underline">craftsdridha@gmail.com</a> or WhatsApp (+91 97678 07889) with photos or a short video of the damaged box and product.
                </li>
                <li>
                  Upon verification, we will immediately dispatch a <strong>free brand-new replacement piece</strong> at no additional cost to you.
                </li>
                <li>
                  Because each piece is handmade in small batches from natural wood, returns based solely on subjective natural grain differences are not accepted.
                </li>
              </ul>
            </div>

            {/* 7. Contact Information */}
            <div className="space-y-4 pt-6 border-t border-warmgrey/60">
              <h2 className="font-display text-2xl font-bold text-brand-green">
                Customer Support &amp; Workshop Contact
              </h2>
              <div className="bg-brand-cream/30 p-5 rounded-2xl border border-warmgrey/60 space-y-2 text-sm">
                <p className="font-semibold text-brand-green">Dridha Crafts Atelier</p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-gold" />
                  <span>Email: craftsdridha@gmail.com</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-gold" />
                  <span>Support / WhatsApp: +91 97678 07889</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-gold" />
                  <span>Location: Kashmir Valley, Jammu &amp; Kashmir, India</span>
                </p>
              </div>
            </div>

          </div>
        </Container>
      </section>
    </main>
  );
}
