"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Mounts Lenis once at the marketing root for smooth scrolling. Lenis runs on
 * a single rAF loop, so we only ever instantiate it once. We gate by
 * `prefers-reduced-motion` and a `(hover: hover)` check — touch devices keep
 * native momentum (which is already excellent) and motion-sensitive users get
 * the browser's default linear scroll.
 */
export default function LenisProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouch = !window.matchMedia("(hover: hover)").matches;
    if (prefersReducedMotion || isTouch) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
