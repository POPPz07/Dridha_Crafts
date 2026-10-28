"use client";

import { useEffect, useRef } from "react";

/**
 * CustomCursor
 * A premium dot + ring custom cursor for desktop.
 * Follows mouse with spring-like LERP smoothing.
 * Enlarges on hoverable elements.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only desktop
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let rafId: number;
    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        isVisible = true;
      }

      // Dot follows instantly
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
    };

    const onMouseLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      isVisible = false;
    };

    const onHoverableEnter = () => {
      ring.style.width = "48px";
      ring.style.height = "48px";
      ring.style.borderColor = "var(--color-brand-gold)";
      ring.style.backgroundColor = "rgba(196, 162, 101, 0.08)";
    };

    const onHoverableLeave = () => {
      ring.style.width = "32px";
      ring.style.height = "32px";
      ring.style.borderColor = "rgba(196, 162, 101, 0.5)";
      ring.style.backgroundColor = "transparent";
    };

    // LERP animation loop for ring
    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;
    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.12);
      ringY = lerp(ringY, mouseY, 0.12);
      ring.style.transform = `translate(${ringX - 16}px, ${ringY - 16}px)`;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    // Enlarge on interactive elements
    const hoverables = document.querySelectorAll("a, button, [data-cursor-hover]");
    hoverables.forEach((el) => {
      el.addEventListener("mouseenter", onHoverableEnter);
      el.addEventListener("mouseleave", onHoverableLeave);
    });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      hoverables.forEach((el) => {
        el.removeEventListener("mouseenter", onHoverableEnter);
        el.removeEventListener("mouseleave", onHoverableLeave);
      });
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9998] w-2 h-2 rounded-full bg-brand-gold pointer-events-none opacity-0 transition-opacity duration-200 hidden lg:block"
        aria-hidden="true"
        style={{ willChange: "transform" }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9997] w-8 h-8 rounded-full border border-brand-gold/50 pointer-events-none opacity-0 transition-all duration-200 ease-out hidden lg:block"
        aria-hidden="true"
        style={{ willChange: "transform" }}
      />
    </>
  );
}
