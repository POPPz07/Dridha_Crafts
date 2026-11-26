import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Shield, Lock, FileText, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Dridha Crafts",
  description:
    "Learn how Dridha Crafts collects, protects, and handles your personal data for orders, authentication, and pan-India shipping.",
  alternates: {
    canonical: "https://www.dridhacrafts.co.in/privacy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "November 26, 2026";

  return (
    <main className="min-h-screen pt-28 pb-20 bg-brand-cream">
      {/* Header */}
      <section className="relative overflow-hidden pb-12 border-b border-warmgrey/60">
        <Container size="narrow" className="text-center space-y-4">
          <Badge variant="handcrafted">Legal & Compliance</Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-green tracking-tight">
            Privacy Policy
          </h1>
          <p className="font-body text-sm sm:text-base text-charcoal/70 max-w-xl mx-auto">
            At Dridha Crafts, we hold a quiet reverence for your personal privacy, just as we do for our natural Kashmiri pine woodcraft.
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

            {/* 1. Introduction */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">1</span>
                Introduction & Scope
              </h2>
              <p className="text-sm">
                This Privacy Policy describes how <strong>Dridha Crafts</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses, stores, and protects your information when you visit{" "}
                <Link href="/" className="text-brand-green font-semibold underline hover:text-brand-brown">
                  https://www.dridhacrafts.co.in
                </Link>{" "}
                or purchase our handcrafted wooden desk accessories.
              </p>
              <p className="text-sm">
                We are committed to full compliance with the <strong>Digital Personal Data Protection Act (DPDP Act, 2023)</strong> and the <strong>Information Technology Act, 2000</strong> of India.
              </p>
            </div>

            {/* 2. Information We Collect */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">2</span>
                Information We Collect
              </h2>
              <p className="text-sm">
                We collect only the minimum personal data strictly necessary to fulfill your orders, provide customer support, and authenticate your account:
              </p>
              <ul className="space-y-2.5 text-sm list-disc pl-5">
                <li>
                  <strong>Contact & Identity Details:</strong> Full name, email address, and 10-digit Indian phone number (required for shipping notifications and courier coordination).
                </li>
                <li>
                  <strong>Delivery Address:</strong> Complete postal address, city, state, and PIN code to dispatch handcrafted products from our Kashmir atelier.
                </li>
                <li>
                  <strong>Account Credentials & OAuth Profile:</strong> When logging in with Google or Email, our authentication partner (Supabase) securely receives your name, email, and avatar. We never store or see your raw passwords.
                </li>
                <li>
                  <strong>Custom Commission Details:</strong> Workstation photos, dimensions, or text engravings you voluntarily share with our artisans via WhatsApp or on-site forms.
                </li>
              </ul>
            </div>

            {/* 3. Payment Security */}
            <div className="space-y-3 p-6 bg-brand-cream/40 rounded-2xl border border-warmgrey/70">
              <h3 className="font-display text-lg font-bold text-brand-green flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-gold" />
                Payment Information & Security
              </h3>
              <p className="text-sm">
                Dridha Crafts <strong>never collects, stores, or processes your credit/debit card numbers, CVVs, or UPI PINs</strong>.
              </p>
              <p className="text-sm">
                All digital transactions are encrypted and processed through RBI-authorized payment aggregators (Cashfree Payments) and verified UPI channels (Google Pay, PhonePe, Paytm). Payment gateways adhere to global <strong>PCI-DSS Level 1</strong> security standards.
              </p>
            </div>

            {/* 4. How We Use Your Data */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">3</span>
                How We Use Your Data
              </h2>
              <ul className="space-y-2 text-sm list-disc pl-5">
                <li>To process, hand-inspect, package, and deliver your orders pan-India.</li>
                <li>To send electronic receipts, dispatch tracking links, and delivery status updates via email or SMS/WhatsApp.</li>
                <li>To verify artisan feasibility and calculate accurate quotes for bespoke commissions.</li>
                <li>To prevent fraudulent orders, unauthorized admin logins, and maintain platform security.</li>
                <li><strong>Zero-Spam Pledge:</strong> We will never sell, rent, or trade your personal information to third-party data brokers or marketing agencies.</li>
              </ul>
            </div>

            {/* 5. Cookies & Local Storage */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">4</span>
                Cookies & Local Storage
              </h2>
              <p className="text-sm">
                We use strictly essential technical cookies and browser storage solely to:
              </p>
              <ul className="space-y-1.5 text-sm list-disc pl-5">
                <li>Maintain your active customer login session across page visits.</li>
                <li>Preserve products in your shopping bag and wishlist between visits.</li>
                <li>Protect our website against Cross-Site Request Forgery (CSRF) and bot attacks.</li>
              </ul>
            </div>

            {/* 6. Third-Party Infrastructure */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">5</span>
                Authorized Service Providers
              </h2>
              <p className="text-sm">
                To operate our storefront reliably, we share minimal required data with trusted service providers bound by strict confidentiality:
              </p>
              <ul className="space-y-1.5 text-sm list-disc pl-5">
                <li><strong>Supabase Inc.:</strong> Secure cloud database and OAuth authentication hosting.</li>
                <li><strong>Cashfree Payments India:</strong> RBI-licensed payment gateway and webhook reconciliation.</li>
                <li><strong>Logistics Partners (Bluedart, Delhivery, India Post):</strong> Customer name, shipping address, and phone number for transit delivery.</li>
                <li><strong>Vercel & Render:</strong> High-performance server hosting and SSL certificate encryption.</li>
              </ul>
            </div>

            {/* 7. Data Retention & Your Rights */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-sm text-brand-gold font-bold">6</span>
                Your Rights & Data Deletion
              </h2>
              <p className="text-sm">
                You retain complete ownership over your personal data. At any time, you have the right to:
              </p>
              <ul className="space-y-1.5 text-sm list-disc pl-5">
                <li>Request a copy of the personal information we hold about you.</li>
                <li>Update or rectify inaccurate delivery addresses or phone numbers.</li>
                <li>Request permanent deletion of your customer account and stored profile details.</li>
              </ul>
              <p className="text-sm pt-1">
                To exercise these rights, email us at{" "}
                <a href="mailto:craftsdridha@gmail.com" className="text-brand-green font-semibold underline">
                  craftsdridha@gmail.com
                </a>
                . We process data removal requests within 48 business hours.
              </p>
            </div>

            {/* 8. Contact & Grievance Officer */}
            <div className="space-y-4 pt-6 border-t border-warmgrey/60">
              <h2 className="font-display text-2xl font-bold text-brand-green">
                Grievance Officer & Contact
              </h2>
              <p className="text-sm">
                In accordance with the Information Technology Act 2000 and the Consumer Protection (E-Commerce) Rules 2020, our Grievance Officer details are published below:
              </p>
              <div className="bg-brand-cream/30 p-5 rounded-2xl border border-warmgrey/60 space-y-2 text-sm">
                <p className="font-semibold text-brand-green">Dridha Crafts — Grievance Cell</p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-gold" />
                  <span>Email: craftsdridha@gmail.com</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-gold" />
                  <span>WhatsApp &amp; Support: +91 97678 07889</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-gold" />
                  <span>Atelier: Kashmir Valley, Jammu &amp; Kashmir, India</span>
                </p>
              </div>
            </div>

          </div>
        </Container>
      </section>
    </main>
  );
}
