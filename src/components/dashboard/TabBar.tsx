"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Lightbulb,
  NotebookPen,
  Repeat,
  Skull,
  Target,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

export type DashboardView =
  | "today"
  | "projects"
  | "tasks"
  | "routines"
  | "ideas"
  | "notes"
  | "log"
  | "analytics"
  | "graveyard";

const TABS = [
  { id: "today", icon: Target },
  { id: "projects", icon: Activity },
  { id: "tasks", icon: CheckCircle2 },
  { id: "routines", icon: Repeat },
  { id: "ideas", icon: Lightbulb },
  { id: "notes", icon: NotebookPen },
  { id: "log", icon: TrendingUp },
  { id: "analytics", icon: BarChart3 },
  { id: "graveyard", icon: Skull },
] as const;

export function TabBar({
  view,
  onChange,
}: {
  view: DashboardView;
  onChange: (v: DashboardView) => void;
}) {
  const t = useTranslations("tabs");
  return (
    <div className="hidden md:flex gap-1 mb-6 bg-surface p-1 rounded-lg border border-border w-full sm:w-fit overflow-x-auto">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            data-tour={
              tab.id === "projects" ||
              tab.id === "tasks" ||
              tab.id === "routines" ||
              tab.id === "notes"
                ? tab.id
                : undefined
            }
            className={`px-2.5 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none whitespace-nowrap ${
              view === tab.id ? "bg-border text-text" : "text-text-muted hover:text-text"
            }`}
          >
            <Icon size={14} />
            {t(tab.id)}
          </button>
        );
      })}
    </div>
  );
}
