"use client";

import { Crown, Gem, Sparkle, Star } from "lucide-react";

type Plan = "free" | "pro" | "studio" | "admin";

const STYLES: Record<
  Plan,
  { label: string; tone: string; Icon: typeof Crown }
> = {
  free: {
    label: "Free",
    tone: "border-border text-text-muted bg-[color-mix(in_srgb,var(--surface)_60%,transparent)]",
    Icon: Sparkle,
  },
  pro: {
    label: "Pro",
    tone: "border-[color-mix(in_srgb,var(--accent)_40%,transparent)] text-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
    Icon: Star,
  },
  studio: {
    label: "Studio",
    tone: "border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-500/10",
    Icon: Gem,
  },
  admin: {
    label: "Admin",
    tone: "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10",
    Icon: Crown,
  },
};

export function PlanBadge({ plan }: { plan: Plan }) {
  const style = STYLES[plan] ?? STYLES.free;
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
