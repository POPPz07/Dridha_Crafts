"use client";

import { useEffect } from "react";

/**
 * MediaProtection
 * Globally prevents right-click download and drag-to-desktop on all:
 * - Images (<img>, <picture>)
 * - Videos (<video>)
 * - 3D Canvas (<canvas>)
 * - Elements with [data-protect-media]
 *
 * Keeps normal right-click active for text selection, hyperlinks, and form inputs.
 */
export function MediaProtection() {
  useEffect(() => {
    const isProtectedTarget = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;

      // Direct tag matches
      const tag = target.tagName.toLowerCase();
      if (tag === "img" || tag === "video" || tag === "canvas" || tag === "picture") {
        return true;
      }

      // Check closest parent with media protection marker or container
      if (
        target.closest("img") ||
        target.closest("video") ||
        target.closest("canvas") ||
        target.closest("[data-protect-media]") ||
        target.closest(".protect-media")
      ) {
        return true;
      }

      // Check if clicking an overlay or container specifically wrapping media
      const role = target.getAttribute("role");
      if (role === "img") return true;

      return false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (isProtectedTarget(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if (isProtectedTarget(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Attach listeners at document level with capture phase
    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
    };
  }, []);

  return null;
}
