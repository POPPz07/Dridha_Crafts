"use client";

import { useEffect } from "react";

/**
 * useScrollAnimations
 * Applies GSAP ScrollTrigger-powered fade-up and stagger animations
 * to elements with [data-animate] attributes.
 * 
 * Usage: add data-animate="fade-up" | "fade-left" | "stagger" to any element
 */
export function useScrollAnimations() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let gsap: typeof import("gsap").gsap | null = null;
    let ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger | null = null;

    const init = async () => {
      const gsapModule = await import("gsap");
      const { ScrollTrigger: ST } = await import("gsap/ScrollTrigger");
      gsap = gsapModule.gsap;
      ScrollTrigger = ST;
      gsap.registerPlugin(ScrollTrigger);

      // Fade-up elements
      const fadeUpEls = document.querySelectorAll("[data-animate='fade-up']");
      fadeUpEls.forEach((el) => {
        gsap!.fromTo(
          el,
          { opacity: 0, y: 50, willChange: "transform, opacity" },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "cubic-bezier(0.16, 1, 0.3, 1)",
            clearProps: "willChange",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Fade-left elements
      const fadeLeftEls = document.querySelectorAll("[data-animate='fade-left']");
      fadeLeftEls.forEach((el) => {
        gsap!.fromTo(
          el,
          { opacity: 0, x: -60, willChange: "transform, opacity" },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            ease: "cubic-bezier(0.16, 1, 0.3, 1)",
            clearProps: "willChange",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Stagger groups: each child with [data-animate='stagger-child']
      const staggerGroups = document.querySelectorAll("[data-animate='stagger']");
      staggerGroups.forEach((group) => {
        const children = group.querySelectorAll("[data-animate='stagger-child']");
        if (children.length === 0) return;

        gsap!.fromTo(
          children,
          { opacity: 0, y: 40, willChange: "transform, opacity" },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "cubic-bezier(0.16, 1, 0.3, 1)",
            clearProps: "willChange",
            scrollTrigger: {
              trigger: group,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Scale-in elements
      const scaleEls = document.querySelectorAll("[data-animate='scale-in']");
      scaleEls.forEach((el) => {
        gsap!.fromTo(
          el,
          { opacity: 0, scale: 0.9, willChange: "transform, opacity" },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "cubic-bezier(0.16, 1, 0.3, 1)",
            clearProps: "willChange",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    };

    init();

    return () => {
      // Cleanup on unmount
      if (ScrollTrigger) {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      }
    };
  }, []);
}
