"use client";

import { useScrollAnimations } from "@/hooks/useScrollAnimation";
import type { ReactNode } from "react";

/**
 * ScrollAnimationProvider
 * Wraps the app and activates GSAP ScrollTrigger for all [data-animate] elements.
 * Must be a Client Component since it uses useEffect.
 */
export function ScrollAnimationProvider({ children }: { children: ReactNode }) {
  useScrollAnimations();
  return <>{children}</>;
}
