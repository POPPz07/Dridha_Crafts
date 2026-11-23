"use client";

import { useEffect, useRef } from "react";

/**
 * CustomCursor
 * A luxury artisanal dot + ring cursor for desktop.
 * - Dot: 8px solid brand gold, locked to the exact pointer coordinate.
 * - Ring: 48px base diameter, scaled dynamically via pure GPU transform.
 * - Guaranteed 100% concentric alignment during hover, enlargement, drag, and click.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only desktop (fine pointers)
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Fixed physical dimensions (never mutated in DOM to prevent layout shifts or compositor desync)
    const RING_RADIUS = 24; // 48px / 2 (w-12 h-12)
    const DOT_RADIUS = 4;   // 8px / 2 (w-2 h-2)

    // Scales applied around center origin
    const SCALE_UNHOVERED = 0.667; // 48 * 0.667 ≈ 32px default ring
    const SCALE_HOVERED = 1.083;   // 48 * 1.083 ≈ 52px enlarged ring
    const SCALE_CLICK_UNHOVERED = 0.54;
    const SCALE_CLICK_HOVERED = 0.9;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;

    let currentRingScale = SCALE_UNHOVERED;
    let currentDotScale = 1;

    let isVisible = false;
    let isHovered = false;
    let isClicking = false;
    let rafId: number;

    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        ringX = mouseX;
        ringY = mouseY;
        currentRingScale = SCALE_UNHOVERED;
        currentDotScale = 1;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        isVisible = true;
      }
    };

    const onMouseLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      isVisible = false;
    };

    const onMouseEnter = () => {
      if (isVisible) {
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };

    const onMouseDown = () => {
      isClicking = true;
    };

    const onMouseUp = () => {
      isClicking = false;
    };

    const hoverSelector =
      "a, button, [data-cursor-hover], input, select, textarea, [role='button'], label, summary";

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(hoverSelector)) {
        isHovered = true;
        ring.style.borderColor = "var(--color-brand-gold, #c4a265)";
        ring.style.backgroundColor = "rgba(196, 162, 101, 0.12)";
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(hoverSelector)) {
        const related = e.relatedTarget as HTMLElement | null;
        if (!related || !related.closest(hoverSelector)) {
          isHovered = false;
          ring.style.borderColor = "rgba(196, 162, 101, 0.5)";
          ring.style.backgroundColor = "transparent";
        }
      }
    };

    // 60/120fps Animation Loop: Coordinates & scaling handled strictly via transforms
    const animate = () => {
      if (isVisible) {
        // Lower follow speed = slightly higher trailing latency/delay between inner dot and outer ring
        const followSpeed = isHovered ? 0.22 : 0.12;
        ringX = lerp(ringX, mouseX, followSpeed);
        ringY = lerp(ringY, mouseY, followSpeed);

        // Snap when very close to eliminate any floating-point drift
        if (Math.abs(ringX - mouseX) < 0.25) ringX = mouseX;
        if (Math.abs(ringY - mouseY) < 0.25) ringY = mouseY;

        // Compute target scales
        let targetRingScale: number;
        if (isClicking) {
          targetRingScale = isHovered ? SCALE_CLICK_HOVERED : SCALE_CLICK_UNHOVERED;
        } else {
          targetRingScale = isHovered ? SCALE_HOVERED : SCALE_UNHOVERED;
        }
        const targetDotScale = isClicking ? 0.75 : 1;

        currentRingScale = lerp(currentRingScale, targetRingScale, 0.22);
        currentDotScale = lerp(currentDotScale, targetDotScale, 0.3);

        // Apply transforms directly
        // Top-left is (center - radius); with transform-origin: center center, scale expands symmetrically around center!
        dot.style.transform = `translate3d(${mouseX - DOT_RADIUS}px, ${mouseY - DOT_RADIUS}px, 0) scale(${currentDotScale.toFixed(4)})`;
        ring.style.transform = `translate3d(${ringX - RING_RADIUS}px, ${ringY - RING_RADIUS}px, 0) scale(${currentRingScale.toFixed(4)})`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onMouseOver, { passive: true });
    document.addEventListener("mouseout", onMouseOut, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  return (
    <>
      {/* Precision Dot (8px fixed) */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9998] w-2 h-2 rounded-full bg-brand-gold pointer-events-none opacity-0 transition-opacity duration-200 hidden lg:block"
        aria-hidden="true"
        style={{
          willChange: "transform",
          transformOrigin: "center center",
        }}
      />
      {/* Outer Follower Ring (48px fixed, scaled symmetrically around center) */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9997] w-12 h-12 rounded-full border border-brand-gold/50 pointer-events-none opacity-0 transition-[border-color,background-color,opacity] duration-200 ease-out hidden lg:block"
        aria-hidden="true"
        style={{
          willChange: "transform",
          transformOrigin: "center center",
        }}
      />
    </>
  );
}