import {
  Activity,
  AlertCircle,
  Archive,
  Lightbulb,
  Pause,
  Rocket,
  Zap,
} from "lucide-react";
import type { ProjectStatus } from "@/lib/types";

/**
 * Status icons + Tailwind tones. Labels are NOT included here because they're
 * locale-dependent — components should resolve them via
 * `useTranslations("status")(status)`.
 */
export const statusConfig: Record<
  ProjectStatus,
  { color: string; icon: React.ComponentType<{ size?: number }> }
> = {
  idea: {
    color: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
    icon: Lightbulb,
  },
  active: {
    color: "bg-accent/20 text-accent border-accent/30",
    icon: Zap,
  },
  stalled: {
    color: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    icon: AlertCircle,
  },
  paused: {
    color: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30",
    icon: Pause,
  },
  launched: {
    color: "bg-accent-2/20 text-accent-2 border-accent-2/30",
    icon: Rocket,
  },
  archived: {
    color: "bg-text-muted/20 text-text-muted border-text-muted/30",
    icon: Archive,
  },
};

export const statusBorderClass: Record<ProjectStatus, string> = {
  active: "border-l-accent/60",
  idea: "border-l-purple-500/60",
  stalled: "border-l-amber-500/60",
  paused: "border-l-slate-500/60",
  launched: "border-l-accent-2/60",
  archived: "border-l-text-muted",
};

export const STATUS_FILTER_ORDER: Array<"all" | ProjectStatus> = [
  "all",
  "active",
  "stalled",
  "idea",
  "paused",
  "launched",
  "archived",
];

export const fallbackStatusIcon = Activity;
