"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const CLIPS = [
  {
    src: "/videos/brand_video1.mp4",
    poster: "/images/image1.jpeg",
    title: "Hand Carving & Craft",
  },
  {
    src: "/media/craft-motion.mp4",
    poster: "/media/product-angle-b.jpeg",
    title: "Precision Joinery & Assembly",
  },
];

export function MaterialSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const video0Ref = useRef<HTMLVideoElement | null>(null);
  const video1Ref = useRef<HTMLVideoElement | null>(null);
  const transitioningRef = useRef(false);

  const getVideoEl = useCallback((idx: number) => {
    return idx === 0 ? video0Ref.current : video1Ref.current;
  }, []);

  useEffect(() => {
    const el = video0Ref.current;
    if (el) {
      el.play().catch(() => {});
    }
  }, []);

  const handleTimeUpdate = (index: number) => {
    if (index !== activeIdx) return;
    const currentVid = getVideoEl(index);
    if (!currentVid || !currentVid.duration) return;

    const timeLeft = currentVid.duration - currentVid.currentTime;
    if (timeLeft <= 0.8 && !transitioningRef.current) {
      transitioningRef.current = true;
      const nextIdx = (index + 1) % CLIPS.length;
      const nextVid = getVideoEl(nextIdx);
      if (nextVid) {
        nextVid.currentTime = 0;
        nextVid.play().catch(() => {});
      }
      setActiveIdx(nextIdx);
      setTimeout(() => {
        transitioningRef.current = false;
      }, 1200);
    }
  };

  const handleEnded = (index: number) => {
    transitioningRef.current = false;
    const nextIdx = (index + 1) % CLIPS.length;
    const nextVid = getVideoEl(nextIdx);
    if (nextVid && nextVid.paused) {
      nextVid.currentTime = 0;
      nextVid.play().catch(() => {});
    }
    setActiveIdx(nextIdx);

    const finishedVid = getVideoEl(index);
    if (finishedVid) {
      finishedVid.pause();
      finishedVid.currentTime = 0;
    }
  };

  const switchTo = (nextIdx: number) => {
    if (nextIdx === activeIdx) return;
    transitioningRef.current = false;
    const nextVid = getVideoEl(nextIdx);
    const prevVid = getVideoEl(activeIdx);
    if (nextVid) {
      nextVid.currentTime = 0;
      nextVid.play().catch(() => {});
    }
    setActiveIdx(nextIdx);
    if (prevVid) {
      setTimeout(() => {
        prevVid.pause();
        prevVid.currentTime = 0;
      }, 700);
    }
  };

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

        {/* Right — dual video crossfade player */}
        <div className="relative overflow-hidden" style={{ minHeight: "520px", background: "#203d2b" }}>
          {CLIPS.map((clip, idx) => (
            <video
              key={clip.src}
              ref={idx === 0 ? video0Ref : video1Ref}
              src={clip.src}
              poster={clip.poster}
              muted
              playsInline
              preload="auto"
              onTimeUpdate={() => handleTimeUpdate(idx)}
              onEnded={() => handleEnded(idx)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                activeIdx === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            />
          ))}

          {/* Gradient edge blend */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, #123526 0%, transparent 18%, transparent 82%, #123526 100%), linear-gradient(0deg, rgba(6,24,15,0.45) 0%, transparent 35%)",
            }}
          />

          {/* Motion label & manual switch pills */}
          <div className="absolute bottom-6 left-6 right-6 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.14em] flex items-center gap-2 drop-shadow-md">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5c89d] animate-pulse" />
              From our first field notes:{" "}
              <span className="text-[#e5c89d] normal-case tracking-normal font-semibold">
                {CLIPS[activeIdx].title}
              </span>
            </span>

            {/* Interactive clip indicator dots */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 pointer-events-auto">
              {CLIPS.map((clip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => switchTo(idx)}
                  title={clip.title}
                  aria-label={`Switch to ${clip.title}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeIdx === idx ? "w-6 bg-[#e5c89d]" : "w-2 bg-white/30 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
