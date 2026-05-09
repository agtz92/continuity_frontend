"use client";

import { AlertTriangle, Clock, Target, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BacklogHealth } from "@/lib/types";
import { PanelCard } from "./PanelCard";

export function BacklogPanel({ backlog }: { backlog: BacklogHealth }) {
  const t = useTranslations("analytics.backlog");
  const tiles = [
    {
      label: t("overdue"),
      value: backlog.overdueTasks,
      icon: <AlertTriangle size={14} className="text-rose-400" />,
      tone: "text-rose-300",
    },
    {
      label: t("dueSoon"),
      value: backlog.dueSoonTasks,
      icon: <Clock size={14} className="text-amber-400" />,
      tone: "text-amber-300",
    },
    {
      label: t("quickWins"),
      value: backlog.quickWins,
      icon: <Target size={14} className="text-emerald-400" />,
      tone: "text-emerald-300",
      hint: t("quickWinsHint"),
    },
    {
      label: t("almostThere"),
      value: backlog.almostThere,
      icon: <Trophy size={14} className="text-blue-400" />,
      tone: "text-blue-300",
      hint: t("almostThereHint"),
    },
  ];

  return (
    <PanelCard
      title={t("title")}
      icon={<AlertTriangle size={16} className="text-amber-400" />}
      subtitle={t("subtitle", { count: backlog.openTasks })}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3"
            title={tile.hint}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              {tile.icon}
              {tile.label}
            </div>
            <div className={`text-2xl font-semibold mt-1 ${tile.tone}`}>
              {tile.value}
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
