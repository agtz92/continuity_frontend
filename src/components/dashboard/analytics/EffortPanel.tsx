"use client";

import { Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";
import type { EffortStats } from "@/lib/types";
import { PanelCard } from "./PanelCard";

export function EffortPanel({ effort }: { effort: EffortStats }) {
  const t = useTranslations("analytics.effort");
  const coverage = Math.round(effort.tasksWithEffortPct * 100);
  const subtitle =
    coverage >= 100 ? undefined : t("subtitle", { coverage });

  return (
    <PanelCard
      title={t("title")}
      icon={<Hourglass size={16} className="text-orange-400" />}
      subtitle={subtitle}
    >
      <div className="flex items-baseline gap-2 mb-4">
        <div className="text-3xl font-semibold text-zinc-100 tabular-nums">
          {effort.effortHoursTotal}
        </div>
        <div className="text-sm text-zinc-500">{t("totalHoursSuffix")}</div>
      </div>
      {effort.effortHoursByProject.length === 0 ? (
        <div className="text-sm text-zinc-500">{t("empty")}</div>
      ) : (
        <ul className="space-y-1.5">
          {effort.effortHoursByProject.map((row) => (
            <li
              key={row.projectId}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-zinc-200 truncate">{row.name}</span>
              <span className="text-zinc-400 tabular-nums shrink-0">
                {row.hours} h
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
