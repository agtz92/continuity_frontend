"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

const THRESHOLD = 70;
const MAX_PULL = 120;
const RESISTANCE = 0.5;

/**
 * Pull-to-refresh gesture for the document viewport.
 *
 * Mobile-only. Listens for a touchstart at scroll position 0 and tracks the
 * vertical delta; when the user releases past THRESHOLD, calls `onRefresh()`.
 * Browser's native pull-to-refresh is suppressed by `overscroll-behavior-y:
 * contain` on `body` (set in globals.css) so this never competes with a page
 * reload.
 *
 * Renders an indicator pinned to the top while the gesture is active or while
 * the refresh is in flight; otherwise renders nothing.
 */
export function PullToRefresh({
  onRefresh,
}: {
  onRefresh: () => Promise<unknown>;
}) {
  const isMobile = useIsMobile();
  const [pulling, setPulling] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const gestureLocked = useRef<"vertical" | "horizontal" | null>(null);
  const refreshingRef = useRef(false);
  const pullingRef = useRef(0);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    pullingRef.current = pulling;
  }, [pulling]);

  useEffect(() => {
    if (!isMobile) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (window.scrollY > 0) return;
      const touch = e.touches[0];
      if (!touch) return;
      startY.current = touch.clientY;
      startX.current = touch.clientX;
      gestureLocked.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || startX.current === null) return;
      if (refreshingRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dy = touch.clientY - startY.current;
      const dx = touch.clientX - startX.current;

      // Lock the gesture axis on first meaningful move. If the user is
      // scrolling a horizontal container (e.g. the Analytics chip selector
      // or the Today counters carousel), abandon the pull entirely so we
      // never preventDefault their horizontal swipe.
      if (gestureLocked.current === null) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          gestureLocked.current =
            Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
        }
      }
      if (gestureLocked.current === "horizontal") {
        if (pullingRef.current > 0) setPulling(0);
        return;
      }

      if (dy <= 0) {
        if (pullingRef.current > 0) setPulling(0);
        return;
      }
      if (e.cancelable) e.preventDefault();
      setPulling(Math.min(dy * RESISTANCE, MAX_PULL));
    };

    const onTouchEnd = () => {
      if (startY.current === null) return;
      const distance = pullingRef.current;
      startY.current = null;
      startX.current = null;
      gestureLocked.current = null;
      if (distance >= THRESHOLD && !refreshingRef.current) {
        setRefreshing(true);
        Promise.resolve(onRefresh())
          .catch(() => {})
          .finally(() => {
            setRefreshing(false);
            setPulling(0);
          });
      } else {
        setPulling(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isMobile, onRefresh]);

  if (!isMobile) return null;
  if (pulling === 0 && !refreshing) return null;

  const visibleHeight = refreshing ? 56 : pulling;
  const triggered = pulling >= THRESHOLD;
  const indicatorRotation = refreshing
    ? 0
    : Math.min((pulling / THRESHOLD) * 180, 180);

  return (
    <div
      aria-hidden
      className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-end justify-center pointer-events-none overflow-hidden"
      style={{
        height: visibleHeight,
        transition: refreshing
          ? "height 200ms ease-out"
          : pulling === 0
            ? "height 200ms ease-out"
            : undefined,
      }}
    >
      <div
        className={`mb-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md border ${
          triggered || refreshing
            ? "bg-accent text-bg border-accent"
            : "bg-surface text-text-muted border-border"
        }`}
      >
        <RefreshCw
          size={16}
          className={refreshing ? "animate-spin" : ""}
          style={{
            transform: refreshing ? undefined : `rotate(${indicatorRotation}deg)`,
            transition: refreshing ? undefined : "transform 80ms linear",
          }}
        />
      </div>
    </div>
  );
}
