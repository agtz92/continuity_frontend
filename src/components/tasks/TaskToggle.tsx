"use client";

import { Check, Lock, Repeat } from "lucide-react";

/**
 * Circular completion toggle shared by every task/routine row. Replaces the
 * old 18px muted CheckCircle2 icon, which read as decoration rather than a
 * control: an empty 24px ring reads as "fill me in", and the done state fills
 * with the theme accent plus a check.
 *
 * - kind "task": solid ring; turns red while overdue, shows a lock when blocked.
 * - kind "routine": dashed ring with a Repeat glyph ("this one recurs").
 * The ghost check fades in on hover so the affordance is unmistakable.
 */
export function TaskToggle({
  done,
  overdue = false,
  blocked = false,
  kind = "task",
  onToggle,
  label,
}: {
  done: boolean;
  overdue?: boolean;
  blocked?: boolean;
  kind?: "task" | "routine";
  onToggle: () => void;
  label: string;
}) {
  const ring = done
    ? "bg-accent border-accent"
    : overdue
    ? "border-red-500/70 hover:border-red-500 hover:bg-red-500/10"
    : "border-[color-mix(in_srgb,var(--text-muted)_60%,transparent)] hover:border-accent hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={label}
      title={label}
      // -m-2 p-2 pads the hit area to ~40px without growing the visual circle.
      className="shrink-0 -m-2 p-2 group/toggle"
    >
      <span
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${ring} ${
          kind === "routine" && !done ? "border-dashed" : ""
        }`}
      >
        {done ? (
          <Check size={14} className="text-bg" strokeWidth={3} />
        ) : blocked ? (
          <Lock size={11} className="text-text-muted" />
        ) : kind === "routine" ? (
          <Repeat size={11} className="text-text-muted" />
        ) : (
          <Check
            size={14}
            className="text-text-muted opacity-0 group-hover/toggle:opacity-60 transition-opacity"
          />
        )}
      </span>
    </button>
  );
}
