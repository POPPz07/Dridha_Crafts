import Link from "next/link";

export function MaterialSection() {
  return (
    <section className="overflow-hidden" style={{ background: "#123526", color: "#fbf9f1" }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-12 lg:py-20"
          style={{ minHeight: "560px" }}
        >
          {/* Left — copy */}
          <div
            className="lg:col-span-7 flex flex-col justify-center"
            style={{ maxWidth: "34rem" }}
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
              style={{ fontSize: "clamp(2.75rem, 4.5vw, 4.8rem)", color: "#fbf9f1" }}
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

          {/* Right — video (full uncropped portrait aspect ratio) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-start">
            <div
              className="relative overflow-hidden rounded-3xl shadow-2xl aspect-[478/850] w-auto h-[520px] sm:h-[560px] max-w-full"
              style={{ background: "#203d2b" }}
            >
              <video
                src="/media/craft-motion.mp4"
                autoPlay
                muted
                loop
                playsInline
                poster="/media/product-angle-b.jpeg"
                className="w-full h-full object-cover"
              />
              {/* Subtle bottom vignette for label readability */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(6,24,15,0.7) 0%, transparent 22%)",
                }}
              />
              {/* Motion label */}
              <span className="absolute bottom-5 left-5 text-white/80 text-[10px] font-bold uppercase tracking-[0.14em] flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5c89d] animate-pulse" />
                From our first field notes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
