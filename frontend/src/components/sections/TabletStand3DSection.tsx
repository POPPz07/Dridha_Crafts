"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDownRight } from "lucide-react";

const TabletStandScene = dynamic(
  () => import("@/components/3d/TabletStandScene").then((m) => m.TabletStandScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] flex items-center justify-center bg-[#f2e8d7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#123526]/30 border-t-[#123526] animate-spin" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#123526]/60">
            Loading 3D Tablet Stand…
          </span>
        </div>
      </div>
    ),
  }
);

export function TabletStand3DSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] min-h-[680px] lg:min-h-[750px] bg-[#f2e8d7] border-t border-warmgrey/50 overflow-hidden">
      {/* Left: Interactive 3D Canvas */}
      <div
        className="relative min-h-[480px] sm:min-h-[560px] lg:min-h-[750px] overflow-hidden"
        style={{
          background: "radial-gradient(circle at 50% 42%, #fff7e8 0, #e9cfaa 56%, #cb9361 120%)",
        }}
      >
        {/* Inset border outline matching reference design */}
        <div className="absolute inset-4 sm:inset-5 z-10 border border-[#13261d]/15 rounded-2xl pointer-events-none" />

        {/* Caption */}
        <span className="absolute z-20 top-7 left-7 sm:top-9 sm:left-9 max-w-[15rem] text-[#123526] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] leading-relaxed select-none pointer-events-none">
          A multi-angle form study — drag to take a closer look
        </span>

        {/* 3D Scene */}
        <div className="w-full h-full absolute inset-0">
          <TabletStandScene />
        </div>
      </div>

      {/* Right: Editorial Copy & CTA */}
      <div className="flex flex-col items-start justify-center p-8 sm:p-14 lg:p-20 bg-[#faf6ed]">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-4">
          <span className="block w-8 h-px bg-[#9a6039]" />
          <span className="text-[#9a6039] text-[11px] font-black uppercase tracking-[0.17em]">
            Multi-Angle Stand — 3D Preview
          </span>
        </div>

        {/* Heading */}
        <h2
          className="font-serif font-normal text-[#123526] tracking-[-0.06em] leading-[0.88] mb-5 text-[clamp(2.8rem,5vw,5.5rem)]"
        >
          Three angles.
          <br />
          <span className="italic font-light text-[#c28959]">
            One steady canvas.
          </span>
        </h2>

        {/* Description */}
        <p className="max-w-[28rem] text-[#13261d]/70 text-sm sm:text-base leading-relaxed mb-8">
          An adjustable wooden easel engineered for laptops, tablets, and sketchpads.
          Dual cylindrical tenons slot securely into triple-stepped adjustment sockets,
          anchored by a sculpted parabolic arch foot for rock-solid stability at any elevation.
        </p>

        {/* CTA */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#123526] text-[#fbf9f1] font-bold text-xs uppercase tracking-widest rounded-full hover:bg-[#6d4024] hover:-translate-y-0.5 transition-all duration-300 shadow-medium"
        >
          Meet the collection
          <ArrowDownRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
