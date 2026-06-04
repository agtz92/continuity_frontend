"use client";

import { RotateCcw, X } from "lucide-react";

export function TodayCustomizeBar({
  onExit,
  onReset,
  labels,
}: {
  onExit: () => void;
  onReset: () => void;
  labels: { title: string; close: string; reset: string; done: string };
}) {
  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-bg/95 backdrop-blur border-b border-border flex items-center gap-3">
      <button
        type="button"
        onClick={onExit}
        aria-label={labels.close}
        className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]"
      >
        <X size={20} />
      </button>
      <h2 className="text-base font-semibold flex-1 truncate">{labels.title}</h2>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border bg-surface hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)] text-text-muted hover:text-text transition-colors"
      >
        <RotateCcw size={14} />
        <span className="hidden sm:inline">{labels.reset}</span>
      </button>
      <button
        type="button"
        onClick={onExit}
        className="text-sm px-4 py-1.5 rounded-md bg-accent text-white hover:opacity-90 font-medium"
      >
        {labels.done}
      </button>
    </div>
  );
}
