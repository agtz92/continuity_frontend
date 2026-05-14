"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BottomSheet } from "./BottomSheet";

export function Modal({
  title,
  children,
  footer,
  onClose,
  widthClassName = "sm:w-[28rem] sm:min-w-[20rem] sm:max-w-[min(95vw,80rem)]",
}: {
  title: string;
  children: React.ReactNode;
  /**
   * Sticky footer area for primary actions (e.g. Save / Cancel). On mobile this
   * stays pinned to the bottom of the BottomSheet above the safe-area; on desktop
   * it renders at the bottom of the modal content area.
   */
  footer?: React.ReactNode;
  onClose: () => void;
  /** Tailwind width classes for the sm+ breakpoint. Override to make the modal wider by default. */
  widthClassName?: string;
}) {
  const isMobile = useIsMobile();
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  if (isMobile) {
    return (
      <BottomSheet
        title={title}
        onClose={onClose}
        initialHeight="auto"
        footer={footer}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 z-50"
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onMouseUp={(e) => {
        if (
          e.target === e.currentTarget &&
          mouseDownTargetRef.current === e.currentTarget
        ) {
          onClose();
        }
        mouseDownTargetRef.current = null;
      }}
    >
      <div
        className={`bg-surface border border-border rounded-xl p-4 sm:p-5 w-full ${widthClassName} h-auto max-h-[90vh] overflow-auto sm:resize relative flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-muted p-1 -m-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        {footer && <div className="shrink-0 pt-3">{footer}</div>}
        <div
          aria-hidden
          className="hidden sm:block pointer-events-none absolute bottom-1 right-1 text-text-muted"
          title="Drag to resize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="10" cy="6" r="1" />
            <circle cx="6" cy="10" r="1" />
            <circle cx="10" cy="10" r="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}
