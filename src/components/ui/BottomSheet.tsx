"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type InitialHeight = "auto" | "50" | "75" | "95";

const HEIGHT_CLASS: Record<Exclude<InitialHeight, "auto">, string> = {
  "50": "h-[50vh]",
  "75": "h-[75vh]",
  "95": "h-[95vh]",
};

type BottomSheetProps = {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  /** Initial height. "auto" sizes to content (capped at 95vh). */
  initialHeight?: InitialHeight;
  /** When false, swipe-down and backdrop-tap won't dismiss (e.g. destructive flows). */
  dismissible?: boolean;
  /** Sticky footer (e.g. primary CTA always visible above the keyboard). */
  footer?: React.ReactNode;
  /** Optional class applied to the sheet container. */
  className?: string;
};

const DISMISS_DISTANCE_PX = 100;
const DISMISS_VELOCITY = 0.6; // px/ms

export function BottomSheet({
  title,
  children,
  onClose,
  initialHeight = "auto",
  dismissible = true,
  footer,
  className = "",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    startY: number;
    startedAt: number;
    pointerId: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, dismissible]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dismissible) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startY: e.clientY,
      startedAt: performance.now(),
      pointerId: e.pointerId,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const delta = e.clientY - state.startY;
    if (delta > 0) setDragOffset(delta);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const elapsed = performance.now() - state.startedAt;
    const distance = e.clientY - state.startY;
    const velocity = elapsed > 0 ? distance / elapsed : 0;
    dragStateRef.current = null;
    if (distance > DISMISS_DISTANCE_PX || velocity > DISMISS_VELOCITY) {
      onClose();
    } else {
      setDragOffset(0);
    }
  };

  const heightClass =
    initialHeight === "auto" ? "max-h-[95vh]" : HEIGHT_CLASS[initialHeight];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={dismissible ? onClose : undefined}
      />
      <div
        ref={sheetRef}
        className={`relative w-full bg-surface border-t border-border rounded-t-2xl shadow-2xl flex flex-col ${heightClass} ${className}`}
        style={{
          transform: mounted
            ? `translateY(${dragOffset}px)`
            : "translateY(100%)",
          transition: dragOffset === 0 ? "transform 250ms ease-out" : "none",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="shrink-0 pt-2 pb-1 cursor-grab touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <div
            aria-hidden
            className="mx-auto h-1 w-9 rounded-full bg-border"
          />
        </div>

        {title && (
          <div className="flex items-center justify-between px-4 pb-3 shrink-0">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text p-1 -m-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-4 py-3 border-t border-border bg-surface">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
