"use client";

import { AlertTriangle, Clock, Target, Trophy } from "lucide-react";
import type { BacklogHealth } from "@/lib/types";
import { PanelCard } from "./PanelCard";

export function BacklogPanel({ backlog }: { backlog: BacklogHealth }) {
  const tiles = [
    {
      label: "Overdue",
      value: backlog.overdueTasks,
      icon: <AlertTriangle size={14} className="text-rose-400" />,
      tone: "text-rose-300",
    },
    {
      label: "Due soon (7d)",
      value: backlog.dueSoonTasks,
      icon: <Clock size={14} className="text-amber-400" />,
      tone: "text-amber-300",
    },
    {
      label: "Quick wins",
      value: backlog.quickWins,
      icon: <Target size={14} className="text-emerald-400" />,
      tone: "text-emerald-300",
      hint: "Projects with ≤2 open tasks",
    },
    {
      label: "Almost there",
      value: backlog.almostThere,
      icon: <Trophy size={14} className="text-blue-400" />,
      tone: "text-blue-300",
      hint: "≥80% complete",
    },
  ];

  return (
    <PanelCard
      title="Backlog"
      icon={<AlertTriangle size={16} className="text-amber-400" />}
      subtitle={`${backlog.openTasks} open tasks total`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3"
            title={t.hint}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              {t.icon}
              {t.label}
            </div>
            <div className={`text-2xl font-semibold mt-1 ${t.tone}`}>
              {t.value}
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
