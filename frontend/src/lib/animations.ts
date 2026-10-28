/**
 * GSAP Animation Presets for Dridha Crafts
 * Reusable animation configurations for consistent premium feel
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins (call once at app initialization)
export function registerGSAPPlugins() {
  if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }
}

// ── Easing Presets ─────────────────────────────────────────────
export const EASE = {
  smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
  smoothIn: "cubic-bezier(0.55, 0, 1, 0.45)",
  smoothOut: "cubic-bezier(0, 0.55, 0.45, 1)",
  elastic: "elastic.out(1, 0.5)",
  power3: "power3.out",
};

// ── Fade Up (standard section reveal) ─────────────────────────
export function fadeUpAnimation(
  element: Element | null,
  options?: { delay?: number; duration?: number; y?: number }
) {
  if (!element) return;
  const { delay = 0, duration = 0.8, y = 40 } = options || {};
  return gsap.fromTo(
    element,
    { opacity: 0, y, willChange: "transform, opacity" },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: EASE.smooth,
      clearProps: "willChange",
    }
  );
}

// ── Staggered Children Reveal ─────────────────────────────────
export function staggerReveal(
  parent: Element | null,
  childSelector: string,
  options?: { stagger?: number; delay?: number; y?: number }
) {
  if (!parent) return;
  const children = parent.querySelectorAll(childSelector);
  const { stagger = 0.12, delay = 0, y = 30 } = options || {};
  return gsap.fromTo(
    children,
    { opacity: 0, y, willChange: "transform, opacity" },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      delay,
      stagger,
      ease: EASE.smooth,
      clearProps: "willChange",
    }
  );
}

// ── ScrollTrigger Fade Up (attach to element on scroll) ──────
export function scrollFadeUp(
  element: Element | null,
  options?: { start?: string; delay?: number; y?: number }
) {
  if (!element || typeof window === "undefined") return;
  const { start = "top 85%", delay = 0, y = 50 } = options || {};

  gsap.fromTo(
    element,
    { opacity: 0, y, willChange: "transform, opacity" },
    {
      opacity: 1,
      y: 0,
      duration: 0.9,
      delay,
      ease: EASE.smooth,
      clearProps: "willChange",
      scrollTrigger: {
        trigger: element,
        start,
        toggleActions: "play none none none",
      },
    }
  );
}

// ── ScrollTrigger Stagger for a Group ─────────────────────────
export function scrollStagger(
  elements: Element[] | NodeListOf<Element> | null,
  options?: { start?: string; stagger?: number; y?: number }
) {
  if (!elements || typeof window === "undefined") return;
  const { start = "top 85%", stagger = 0.1, y = 40 } = options || {};

  gsap.fromTo(
    Array.from(elements),
    { opacity: 0, y, willChange: "transform, opacity" },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger,
      ease: EASE.smooth,
      clearProps: "willChange",
      scrollTrigger: {
        trigger: Array.from(elements)[0] as Element,
        start,
        toggleActions: "play none none none",
      },
    }
  );
}

// ── Scale In (for cards / modals) ─────────────────────────────
export function scaleIn(element: Element | null, options?: { delay?: number }) {
  if (!element) return;
  const { delay = 0 } = options || {};
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.92, willChange: "transform, opacity" },
    {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      delay,
      ease: EASE.smooth,
      clearProps: "willChange",
    }
  );
}

// ── Horizontal Slide In ────────────────────────────────────────
export function slideInFromRight(
  element: Element | null,
  options?: { delay?: number; x?: number }
) {
  if (!element) return;
  const { delay = 0, x = 60 } = options || {};
  return gsap.fromTo(
    element,
    { opacity: 0, x, willChange: "transform, opacity" },
    {
      opacity: 1,
      x: 0,
      duration: 0.8,
      delay,
      ease: EASE.smooth,
      clearProps: "willChange",
    }
  );
}

// ── Magnetic Button Effect ─────────────────────────────────────
export function magneticEffect(
  buttonEl: HTMLElement | null,
  strength: number = 0.3
) {
  if (!buttonEl || typeof window === "undefined") return;

  const handleMouseMove = (e: MouseEvent) => {
    const rect = buttonEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    gsap.to(buttonEl, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: EASE.smooth,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(buttonEl, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: EASE.elastic,
    });
  };

  buttonEl.addEventListener("mousemove", handleMouseMove);
  buttonEl.addEventListener("mouseleave", handleMouseLeave);

  // Return cleanup function
  return () => {
    buttonEl.removeEventListener("mousemove", handleMouseMove);
    buttonEl.removeEventListener("mouseleave", handleMouseLeave);
  };
}
