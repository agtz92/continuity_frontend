"use client";

import { Crown, Sparkle, Star } from "lucide-react";

const STYLES: Record<
  "free" | "pro" | "admin",
  { label: string; tone: string; Icon: typeof Crown }
> = {
  free: {
    label: "Free",
    tone: "border-border text-text-muted bg-surface/60",
    Icon: Sparkle,
  },
  pro: {
    label: "Pro",
    tone: "border-accent/40 text-accent bg-accent/10",
    Icon: Star,
  },
  admin: {
    label: "Admin",
    tone: "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10",
    Icon: Crown,
  },
};

export function PlanBadge({ plan }: { plan: "free" | "pro" | "admin" }) {
  const style = STYLES[plan];
  const Icon = style.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.tone}`}
    >
      <Icon size={10} />
      {style.label}
    </span>
  );
}
