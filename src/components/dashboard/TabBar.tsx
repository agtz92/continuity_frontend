"use client";

import {
  Activity,
  CheckCircle2,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";

export type DashboardView = "today" | "projects" | "tasks" | "ideas" | "log";

const TABS = [
  { id: "today", label: "Today", icon: Target },
  { id: "projects", label: "Projects", icon: Activity },
  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "log", label: "Log", icon: TrendingUp },
] as const;

export function TabBar({
  view,
  onChange,
}: {
  view: DashboardView;
  onChange: (v: DashboardView) => void;
}) {
  return (
    <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-full sm:w-fit overflow-x-auto">
      {TABS.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-2.5 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none whitespace-nowrap ${
              view === t.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon size={14} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
