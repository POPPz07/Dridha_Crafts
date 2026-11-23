"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownRight, Sparkles, X, Mail, MessageSquare, ExternalLink } from "lucide-react";

const CustomCaddyScene = dynamic(
  () => import("@/components/3d/CustomCaddyScene").then((m) => m.CustomCaddyScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] flex items-center justify-center bg-[#f0e3ce]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#123526]/30 border-t-[#123526] animate-spin" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#123526]/60">
            Loading Bespoke 3D Piece…
          </span>
        </div>
      </div>
    ),
  }
);

export function CustomCaddy3DSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919767807889";
  const waMessage = encodeURIComponent(
    "Namaste Dridha Crafts! 🌲\n\nI would like to inquire about a custom wooden product order (such as a tailored pine piece).\n\nPlease share feasibility, pricing, and how we can finalize the dimensions together! 🙏"
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  const emailAddress = "craftsdridha@gmail.com";
  const emailSubject = encodeURIComponent("Custom Wooden Product Inquiry — Dridha Crafts");
  const emailBody = encodeURIComponent(
    "Namaste Dridha Crafts Team,\n\nI would like more details regarding placing a custom wooden product order.\n\nHere are some initial thoughts on what I am looking for:\n- Product Concept / Dimensions:\n- Preferred Wood Polish (Natural / Brown / Amber):\n- Delivery Location (City, State, PIN):\n\nLooking forward to hearing from your artisans!\n\nWarm regards,"
  );
  const mailtoUrl = `mailto:${emailAddress}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] min-h-[680px] lg:min-h-[750px] bg-[#f0e3ce] border-t border-warmgrey/50 overflow-hidden">
        {/* Left: Interactive 3D Canvas */}
        <div
          className="relative min-h-[480px] sm:min-h-[560px] lg:min-h-[750px] overflow-hidden"
          style={{
            background: "radial-gradient(circle at 50% 42%, #fff5e3 0, #e8cfa8 56%, #c58d59 120%)",
          }}
        >
          {/* Inset border outline matching artisan design language */}
          <div className="absolute inset-4 sm:inset-5 z-10 border border-[#13261d]/15 rounded-2xl pointer-events-none" />

          {/* Custom Commission Badge */}
          <div className="absolute z-20 top-7 left-7 sm:top-9 sm:left-9 flex items-center gap-2 px-3 py-1.5 bg-[#123526]/90 backdrop-blur-md text-[#fbf9f1] rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3 h-3 text-[#dfa663]" />
            Custom Commission — 3D Model
          </div>

          {/* 3D Scene */}
          <div className="w-full h-full absolute inset-0">
            <CustomCaddyScene />
          </div>
        </div>

        {/* Right: Editorial Copy, Custom Specifications & CTA */}
        <div className="flex flex-col items-start justify-center p-8 sm:p-14 lg:p-20 bg-[#faf6ee]">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-8 h-px bg-[#9a6039]" />
            <span className="text-[#9a6039] text-[11px] font-black uppercase tracking-[0.17em]">
              Bespoke Woodcraft — Made to Order
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-serif font-normal text-[#123526] tracking-[-0.06em] leading-[0.88] mb-5 text-[clamp(2.8rem,5vw,5.5rem)]"
          >
            Carved for
            <br />
            <span className="italic font-light text-[#c28959]">
              your ritual.
            </span>
          </h2>

          {/* Description */}
          <p className="max-w-[28rem] text-[#13261d]/70 text-sm sm:text-base leading-relaxed mb-6">
            A bespoke desk sculpture crafted from seasoned solid pine: a hollowed semi-cylinder
            tray with an inward-carved sculpted end, paired with a hollow cylinder resting on its right surface area
            featuring a signature top aperture hole and natural knothole grain.
          </p>

          {/* Dimension & Specification Pills */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-[28rem] mb-8 text-xs">
            <div className="p-3 bg-[#123526]/5 rounded-xl border border-[#123526]/10">
              <span className="block font-bold text-[#123526] uppercase tracking-wider text-[10px]">Hollow Semi-Cylinder</span>
              <span className="text-[#13261d]/80 font-mono">24 × 9.5 × 6.5 cm</span>
            </div>
            <div className="p-3 bg-[#123526]/5 rounded-xl border border-[#123526]/10">
              <span className="block font-bold text-[#123526] uppercase tracking-wider text-[10px]">Side Hollow Cylinder</span>
              <span className="text-[#13261d]/80 font-mono">Ø 6.2 cm with Top Hole</span>
            </div>
            <div className="p-3 bg-[#123526]/5 rounded-xl border border-[#123526]/10">
              <span className="block font-bold text-[#123526] uppercase tracking-wider text-[10px]">Opposite End Detail</span>
              <span className="text-[#13261d]/80">Sculpted Inward-Carved Cove</span>
            </div>
            <div className="p-3 bg-[#123526]/5 rounded-xl border border-[#123526]/10">
              <span className="block font-bold text-[#123526] uppercase tracking-wider text-[10px]">Artisan Polish</span>
              <span className="text-[#13261d]/80">Warm Amber Linseed & Wax</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#123526] text-[#fbf9f1] font-bold text-xs uppercase tracking-widest rounded-full hover:bg-[#6d4024] hover:-translate-y-0.5 transition-all duration-300 shadow-medium cursor-pointer"
            >
              Explore Custom Product
              <ArrowDownRight className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-[#13261d]/60 font-medium italic">
              *Crafted upon artisan feasibility consultation
            </span>
          </div>
        </div>
      </section>

      {/* ── Custom Order Inquiry Modal ── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-caddy-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal/65 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-warmgrey/70 overflow-hidden animate-scale-in z-10">
            {/* Header */}
            <div className="bg-brand-green px-7 py-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#e5c89d] text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Bespoke Woodcraft Order
              </div>
              <h3 id="custom-caddy-modal-title" className="font-display text-2xl font-bold">
                Order a Custom Piece
              </h3>
              <p className="text-brand-cream/80 text-xs sm:text-sm mt-1">
                How would you like to connect with our Kashmir workshop for details and custom dimensions?
              </p>
            </div>

            {/* Options Body */}
            <div className="p-6 sm:p-7 space-y-4 bg-brand-cream/20">
              {/* Option 1: WhatsApp (Primary & Recommended) */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsModalOpen(false)}
                className="group block p-4 rounded-2xl border-2 border-[#25D366] bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-all text-left shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-brand-green text-sm sm:text-base flex items-center gap-1.5">
                        Redirect to WhatsApp
                        <ExternalLink className="w-3.5 h-3.5 text-[#25D366]" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#25D366]/20 text-[#15803d] px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/70 mt-1 leading-relaxed">
                      Instant reply • Share reference photos & sketches • Live consultation with our wood artisans.
                    </p>
                  </div>
                </div>
              </a>

              {/* Option 2: Email */}
              <a
                href={mailtoUrl}
                onClick={() => setIsModalOpen(false)}
                className="group block p-4 rounded-2xl border border-warmgrey bg-white hover:border-brand-green/60 hover:bg-brand-cream/40 transition-all text-left shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-charcoal text-sm sm:text-base group-hover:text-brand-green transition-colors flex items-center gap-1.5">
                        Continue with Email
                        <ExternalLink className="w-3.5 h-3.5 text-charcoal/40 group-hover:text-brand-green" />
                      </span>
                      <span className="text-[10px] font-semibold text-charcoal/50">
                        {emailAddress}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/70 mt-1 leading-relaxed">
                      Send a formal design brief or request a tailored quotation with attached requirements.
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-warmgrey/60 flex items-center justify-between">
              <span className="text-[11px] text-charcoal/50 italic">
                Each bespoke piece is handcrafted from naturally fallen Kashmir pine.
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-semibold text-charcoal/60 hover:text-charcoal transition-colors px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
