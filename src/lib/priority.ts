import type { Priority } from "@/lib/types";

export const priorityChipClass: Record<Priority, string> = {
  critical: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40",
  high: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40",
  medium: "bg-accent/15 text-accent border-accent/30",
  low: "bg-accent-2/15 text-accent-2 border-accent-2/30",
};

export const priorityStripeClass: Record<Priority, string> = {
  critical: "bg-red-500/70",
  high: "bg-orange-500/70",
  medium: "bg-accent/60",
  low: "bg-accent-2/60",
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
