import Image from "next/image";
import Link from "next/link";

export function ImageHero() {
  return (
    <section
      className="relative flex items-end overflow-hidden"
      style={{ minHeight: "min(860px, 100svh)" }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/media/product-landscape-detail.jpeg"
          alt="Handmade wooden desk stand in the Kashmir landscape"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "53% 57%", filter: "saturate(0.68) contrast(1.04)" }}
        />
        {/* Dual gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(6,24,15,0.88) 0%, rgba(6,24,15,0.3) 56%, rgba(6,24,15,0.6) 100%), linear-gradient(0deg, rgba(6,24,15,0.65) 0%, transparent 45%)",
          }}
        />
      </div>

      {/* Content grid */}
      <div
        className="relative z-10 w-full max-w-[1200px] mx-auto px-5 sm:px-8"
        style={{ paddingTop: "8rem", paddingBottom: "3rem" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
          {/* Main copy */}
          <div className="max-w-[50rem]">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-8 h-px bg-[#e5c89d]" />
              <span
                className="text-[#e5c89d] text-[11px] font-black uppercase tracking-[0.17em]"
              >
                Handmade in the Kashmir Valley
              </span>
            </div>

            <h1
              className="font-serif text-white leading-none tracking-[-0.075em] mb-6"
              style={{ fontSize: "clamp(3.6rem, 8.7vw, 8.9rem)", fontWeight: 400 }}
            >
              Your desk,
              <br />
              <em className="not-italic" style={{ color: "#e5c89d" }}>more yours.</em>
            </h1>

            <p className="text-white/80 leading-relaxed mb-8 max-w-[29rem]" style={{ lineHeight: 1.75 }}>
              Wooden essentials shaped slowly by local hands, for people who find
              focus in the things they keep close.
            </p>

            <Link
              href="/shop"
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-[#e5c89d] text-[#092417] text-sm font-bold uppercase tracking-wider rounded-full hover:bg-white transition-all duration-300 hover:-translate-y-0.5 shadow-lg"
            >
              Explore the collection ↘
            </Link>
          </div>

          {/* Aside caption — desktop only */}
          <div
            className="hidden lg:block w-48 border-t border-white/40 pt-4 text-white/70 text-[11px] leading-relaxed"
          >
            The first collection is taking shape. Discover handmade desk pieces
            with the calm, warmth and character of natural wood.
          </div>
        </div>
      </div>

      {/* Vertical scroll label */}
      <span
        className="absolute right-8 bottom-8 z-10 text-white/50 text-[10px] font-black uppercase tracking-[0.12em]"
        style={{ writingMode: "vertical-rl" }}
      >
        Scroll to wander
      </span>
    </section>
  );
}
