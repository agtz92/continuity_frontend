import type { Priority } from "@/lib/types";

export const priorityChipClass: Record<Priority, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  medium: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  low: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};

export const priorityStripeClass: Record<Priority, string> = {
  critical: "bg-red-500/70",
  high: "bg-orange-500/70",
  medium: "bg-emerald-500/60",
  low: "bg-blue-500/60",
};

export const PRIORITY_FILTER_ORDER: Array<"all" | Priority> = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
];

export type ProjectSortMode =
  | "smart"
  | "priority"
  | "recent"
  | "name"
  | "status";

export const PROJECT_SORT_MODES: ProjectSortMode[] = [
  "smart",
  "priority",
  "recent",
  "name",
  "status",
];
