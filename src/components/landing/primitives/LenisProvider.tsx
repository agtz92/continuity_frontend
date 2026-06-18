"use client";

import { useEffect } from "react";

/**
 * Mounts Lenis once at the marketing root for smooth scrolling. Lenis runs on
 * a single rAF loop, so we only ever instantiate it once. We gate by
 * `prefers-reduced-motion` and a `(hover: hover)` check — touch devices keep
 * native momentum (which is already excellent) and motion-sensitive users get
 * the browser's default linear scroll.
 *
 * `lenis` is imported dynamically *after* those gates so the ~bundle never ships
 * to phones/tablets (which skip it) — it only downloads on pointer devices that
 * will actually use smooth scroll.
 */
export default function LenisProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouch = !window.matchMedia("(hover: hover)").matches;
    if (prefersReducedMotion || isTouch) return;

    let frame = 0;
    let destroy: (() => void) | undefined;
    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;

      const lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      }
      frame = requestAnimationFrame(raf);

      destroy = () => {
        cancelAnimationFrame(frame);
        lenis.destroy();
      };
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return null;
}
