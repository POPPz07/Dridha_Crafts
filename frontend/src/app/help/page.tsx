import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help & FAQ — Handcrafted Wooden Desk Accessories | Dridha Crafts",
  description:
    "Find answers about Dridha Crafts handcrafted pine desk accessories, Pan-India shipping, custom artisan engraving, and wood care instructions.",
  alternates: {
    canonical: "https://www.dridhacrafts.co.in/help",
  },
  openGraph: {
    title: "Help & FAQ — Dridha Crafts",
    description:
      "Answers to common questions about handcrafted wooden desk accessories, shipping across India, custom engraving, and wood care.",
    url: "https://www.dridhacrafts.co.in/help",
    siteName: "Dridha Crafts",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Help & FAQ — Dridha Crafts",
    description:
      "Answers to common questions about handcrafted wooden desk accessories, shipping across India, and wood care.",
  },
};

const FAQ_CATEGORIES = [
  {
    heading: "About the Products",
    items: [
      {
        q: "Are Dridha Crafts products truly handmade?",
        a: "Every piece is hand-shaped and finished with natural oil wax by artisans in the Kashmir Valley. Subtle organic ripples, natural rawness, and slight variations in grain and tone are authentic hallmarks of living mountain pine — a feature, not a flaw.",
      },
      {
        q: "What wood do you use?",
        a: "Our current collection is made from fallen pine sourced sustainably in small batches. We maintain a strict zero-deforestation policy — we only work with naturally fallen or reclaimed wood from mountain trees.",
      },
      {
        q: "How do I care for my piece?",
        a: "Wipe clean with a dry or lightly damp cloth. Avoid prolonged exposure to direct sunlight or water. Once or twice a year, apply a thin coat of food-safe mineral oil or beeswax to maintain the natural lustre.",
      },
      {
        q: "Will my product look exactly like the photos?",
        a: "Each piece is unique. The grain pattern, knots and warm tones shown in our photos are representative but your piece will carry its own character — which is the whole point.",
      },
    ],
  },
  {
    heading: "Orders & Shipping",
    items: [
      {
        q: "Do you ship pan-India?",
        a: "Yes — we deliver pan-India on every order, safely packaged directly from our Kashmir workshop.",
      },
      {
        q: "How long does delivery take?",
        a: "Orders are hand-inspected and dispatched within 2–3 business days. Delivery typically takes 4–7 business days depending on your pin code across India.",
      },
      {
        q: "Can I track my order?",
        a: "Yes. Once dispatched you will receive a tracking link via email and/or SMS. You can also check order status in your account dashboard.",
      },
      {
        q: "Do you ship internationally?",
        a: "Not yet. We are focused on serving India first and doing it well. International shipping is on the roadmap.",
      },
    ],
  },
  {
    heading: "Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We currently accept UPI payments via WhatsApp (GPay, PhonePe, Paytm). After placing your order, you will be redirected to WhatsApp where our team will share our official QR code for instant, verified payment.",
      },
      {
        q: "Is Cash on Delivery (COD) available?",
        a: "We do not offer Cash on Delivery. To maintain handcrafted quality and direct-to-artisan transparency, all orders are fulfilled via secure prepaid UPI on WhatsApp.",
      },
    ],
  },
  {
    heading: "Gifting & Bespoke Commissions",
    items: [
      {
        q: "Do you offer corporate or milestone gifting sets?",
        a: "Yes. Every Dridha Crafts product and combo is securely packed for safe transit, accompanied by our signature thank-you note and authentic artisan seal. For team gifting, executive milestones, or housewarmings (10+ sets), reach out to us at craftsdridha@gmail.com or via WhatsApp for curated arrangements.",
      },
      {
        q: "Can I request custom dimensions, designs, or personalized woodcraft?",
        a: "Yes, on a selective basis. Because each piece is carved by hand from naturally fallen mountain pine, custom designs, tailored laptop dimensions, or personalized engravings depend on workshop feasibility. Message us on WhatsApp or email craftsdridha@gmail.com with your vision and dimensions to discuss feasibility with our craftsman.",
      },
      {
        q: "Are Dridha Crafts products part of a matching desk ecosystem?",
        a: "Yes. Our collection is conceived as a one-stop desk atelier. Our laptop stands, interlocking mobile holders, dual headphone audio cradles, and pine bookends all share matching Kashmir pine wood grain and warm tones, allowing you to curate a cohesive, unified workspace where every accessory belongs together.",
      },
      {
        q: "How can I contact support?",
        a: "Email us at craftsdridha@gmail.com or message us directly on WhatsApp (+91 97678 07889). We aim to respond within 24 hours on business days.",
      },
    ],
  },
];

export default function HelpPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_CATEGORIES.flatMap((category) =>
      category.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      }))
    ),
  };

  return (
    <main className="min-h-screen bg-[#fbf9f1]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Header */}
      <section
        className="pt-36 pb-20 text-center"
        style={{ background: "linear-gradient(180deg, #123526 0%, #1b4a33 60%, #fbf9f1 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-5">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="block w-8 h-px bg-[#e5c89d]" />
            <span className="text-[#e5c89d] text-[11px] font-black uppercase tracking-[0.17em]">
              Support
            </span>
            <span className="block w-8 h-px bg-[#e5c89d]" />
          </div>
          <h1
            className="font-serif font-normal text-white leading-none tracking-tight mb-4"
            style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
          >
            How can we help?
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-lg mx-auto">
            Everything you need to know about our products, shipping, and care.
            Can&apos;t find the answer? Write to us directly.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 py-20">
        <div className="space-y-14">
          {FAQ_CATEGORIES.map((cat) => (
            <div key={cat.heading}>
              {/* Category heading */}
              <h2
                className="font-serif font-normal text-[#123526] mb-6 pb-3 border-b border-[#123526]/15"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
              >
                {cat.heading}
              </h2>

              <div className="space-y-3">
                {cat.items.map((item) => (
                  <details
                    key={item.q}
                    className="group border border-[#123526]/12 rounded-2xl overflow-hidden bg-white"
                  >
                    <summary
                      className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none
                                 text-[#1a1a1a] font-semibold text-sm leading-snug
                                 hover:bg-[#f5f3eb] transition-colors duration-150"
                    >
                      {item.q}
                      {/* +/× toggle */}
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full border border-[#9a6039]/40 flex items-center justify-center
                                   text-[#9a6039] text-sm font-bold
                                   group-open:rotate-45 transition-transform duration-200"
                      >
                        +
                      </span>
                    </summary>
                    <div className="px-6 pb-6 pt-2 text-[#1a1a1a]/70 text-sm leading-relaxed border-t border-[#123526]/08">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-20 rounded-3xl bg-[#123526] text-white p-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="block w-8 h-px bg-[#e5c89d]" />
            <span className="text-[#e5c89d] text-[11px] font-black uppercase tracking-[0.17em]">
              Still need help?
            </span>
            <span className="block w-8 h-px bg-[#e5c89d]" />
          </div>
          <h3
            className="font-serif font-normal mb-3"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}
          >
            Write to us directly.
          </h3>
          <p className="text-white/65 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            We&apos;re a small team and we read every message. We&apos;ll reply
            within 24 hours on business days.
          </p>
          <Link
            href="mailto:craftsdridha@gmail.com"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#e5c89d] text-[#092417] text-sm font-bold uppercase tracking-wider rounded-full hover:bg-white transition-all duration-300"
          >
            craftsdridha@gmail.com
          </Link>
        </div>
      </section>
    </main>
  );
}
