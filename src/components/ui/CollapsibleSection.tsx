"use client";

import { ChevronRight } from "lucide-react";

export function CollapsibleSection({
  open,
  onToggle,
  icon,
  title,
  rightSlot,
  children,
  variant = "h2",
  className = "",
}: {
  open: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  title: React.ReactNode;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  /** "h2" mimics the dashboard top-level section style; "card" wraps in a bordered rounded box (used for accordions inside Tasks). */
  variant?: "h2" | "card";
  className?: string;
}) {
  if (variant === "card") {
    return (
      <div
        className={`border border-border rounded-xl overflow-hidden ${className}`}
      >
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-surface hover:bg-surface/70 text-left"
        >
          <ChevronRight
            size={16}
            className={`text-text-muted transition-transform ${open ? "rotate-90" : ""}`}
          />
          {icon}
          <span className="text-sm font-medium text-text">{title}</span>
          {rightSlot}
        </button>
        {open && (
          <div className="p-2 sm:p-3 bg-bg/40 border-t border-border">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={open}
        className="cursor-pointer select-none mb-3 flex items-center gap-2 flex-wrap rounded-md hover:bg-surface/40 -mx-1 px-1 py-1"
      >
        <ChevronRight
          size={16}
          className={`text-text-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        {rightSlot}
      </div>
      {open && children}
    </div>
  );
}
