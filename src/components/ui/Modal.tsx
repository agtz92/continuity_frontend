"use client";

import { useRef } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const mouseDownTargetRef = useRef<EventTarget | null>(null);
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
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 w-full sm:w-[28rem] sm:min-w-[20rem] sm:max-w-[min(95vw,80rem)] h-auto max-h-[90vh] overflow-auto sm:resize relative flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 -m-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <div
          aria-hidden
          className="hidden sm:block pointer-events-none absolute bottom-1 right-1 text-zinc-600"
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
