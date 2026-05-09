"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

/**
 * Collapsible section used inside an expanded project card and inside the
 * ProjectDetailModal. Default open; user collapses what they don't care about.
 * State is local — resets when the parent unmounts (card collapsed or modal
 * closed).
 */
export function ProjectSection({
  title,
  rightSlot,
  defaultOpen = true,
  children,
}: {
  title: string;
  rightSlot?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="w-full flex items-center justify-between gap-2 mb-1.5 group"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">
          <ChevronRight
            size={12}
            className={`transition-transform ${open ? "rotate-90" : ""}`}
          />
          {title}
        </span>
        {rightSlot}
      </button>
      {open && <div className="pl-[18px]">{children}</div>}
    </div>
  );
}
