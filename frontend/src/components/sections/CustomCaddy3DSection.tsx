"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDownRight, Sparkles } from "lucide-react";

const CustomCaddyScene = dynamic(
  () => import("@/components/3d/CustomCaddyScene").then((m) => m.CustomCaddyScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] flex items-center justify-center bg-[#f0e3ce]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#123526]/30 border-t-[#123526] animate-spin" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#123526]/60">
            Loading Bespoke 3D Caddy…
          </span>
        </div>
      </div>
    ),
  }
);

export function CustomCaddy3DSection() {
  return (
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
          A bespoke desk sculpture crafted from seasoned solid timber: a hollowed semi-cylinder
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
          <Link
            href="/products/custom-artisan-desk-caddy"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#123526] text-[#fbf9f1] font-bold text-xs uppercase tracking-widest rounded-full hover:bg-[#6d4024] hover:-translate-y-0.5 transition-all duration-300 shadow-medium"
          >
            Explore Custom Product
            <ArrowDownRight className="w-4 h-4" />
          </Link>
          <span className="text-[11px] text-[#13261d]/60 font-medium italic">
            *Custom sized to your exact desk space
          </span>
        </div>
      </div>
    </section>
  );
}
