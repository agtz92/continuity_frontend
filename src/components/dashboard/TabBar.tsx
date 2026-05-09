"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

export type DashboardView =
  | "today"
  | "projects"
  | "tasks"
  | "ideas"
  | "log"
  | "analytics";

const TABS = [
  { id: "today", icon: Target },
  { id: "projects", icon: Activity },
  { id: "tasks", icon: CheckCircle2 },
  { id: "ideas", icon: Lightbulb },
  { id: "log", icon: TrendingUp },
  { id: "analytics", icon: BarChart3 },
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
    <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-full sm:w-fit overflow-x-auto">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-2.5 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none whitespace-nowrap ${
              view === tab.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
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
