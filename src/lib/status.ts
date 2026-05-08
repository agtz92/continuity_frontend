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

export const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; icon: React.ComponentType<{ size?: number }> }
> = {
  idea: {
    label: "Idea",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Lightbulb,
  },
  active: {
    label: "Active",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: Zap,
  },
  stalled: {
    label: "Stalled",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: AlertCircle,
  },
  paused: {
    label: "Paused",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: Pause,
  },
  launched: {
    label: "Launched",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: Rocket,
  },
  archived: {
    label: "Archived",
    color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    icon: Archive,
  },
};

export const statusBorderClass: Record<ProjectStatus, string> = {
  active: "border-l-emerald-500/60",
  idea: "border-l-purple-500/60",
  stalled: "border-l-amber-500/60",
  paused: "border-l-slate-500/60",
  launched: "border-l-blue-500/60",
  archived: "border-l-zinc-600",
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
