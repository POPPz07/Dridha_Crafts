import Link from "next/link";

export function MaterialSection() {
  return (
    <section className="overflow-hidden" style={{ background: "#123526", color: "#fbf9f1" }}>
      <div
        className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]"
        style={{ minHeight: "690px" }}
      >
        {/* Left — copy */}
        <div
          className="flex flex-col justify-center"
          style={{
            padding: "clamp(4rem, 8vw, 8rem) clamp(1.25rem, 7vw, 7rem)",
            maxWidth: "35rem",
          }}
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-8 h-px bg-[#e5c89d]" />
            <span className="text-[#e5c89d] text-[11px] font-black uppercase tracking-[0.17em]">
              The Material
            </span>
          </div>

          <h2
            className="font-serif font-normal leading-none tracking-[-0.065em] mb-6"
            style={{ fontSize: "clamp(3rem, 5.6vw, 6rem)", color: "#fbf9f1" }}
          >
            Grain that remembers
            <br />
            where it came from.
          </h2>

          <p className="text-white/75 leading-relaxed mb-8" style={{ lineHeight: 1.8 }}>
            Our early collection uses fallen pine and is made in small batches.
            The natural variation in each piece is a record of the landscape
            it came from.
          </p>

          <Link
            href="/story"
            className="inline-flex items-center gap-2 text-[#e5c89d] text-sm font-semibold hover:gap-3 transition-all duration-200"
          >
            Read the story ↗
          </Link>
        </div>

        {/* Right — video */}
        <div className="relative overflow-hidden" style={{ minHeight: "520px", background: "#203d2b" }}>
          <video
            src="/media/craft-motion.mp4"
            autoPlay
            muted
            loop
            playsInline
            poster="/media/product-angle-b.jpeg"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient edge blend */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, #123526 0%, transparent 18%, transparent 82%, #123526 100%), linear-gradient(0deg, rgba(6,24,15,0.45) 0%, transparent 35%)",
            }}
          />
          {/* Motion label */}
          <span className="absolute bottom-6 left-6 text-white/50 text-[10px] font-bold uppercase tracking-[0.14em] flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5c89d] animate-pulse" />
            From our first field notes
          </span>
        </div>
      </div>
    </section>
  );
}
