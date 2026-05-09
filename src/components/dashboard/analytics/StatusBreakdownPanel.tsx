"use client";

import { PieChart as PieIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StatusCount, CategoryRow, ProjectStatus } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import { PanelCard } from "./PanelCard";

const STATUS_ORDER: ProjectStatus[] = [
  "idea",
  "active",
  "stalled",
  "paused",
  "launched",
  "archived",
];

const STATUS_COLOR: Record<ProjectStatus, string> = {
  idea: "bg-amber-400",
  active: "bg-emerald-400",
  stalled: "bg-rose-400",
  paused: "bg-zinc-400",
  launched: "bg-blue-400",
  archived: "bg-zinc-600",
};

function Bar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatusBreakdownPanel({
  statusCounts,
  categoryBreakdown,
}: {
  statusCounts: StatusCount[];
  categoryBreakdown: CategoryRow[];
}) {
  const t = useTranslations("analytics.statusBreakdown");
  const totalProjects = statusCounts.reduce((acc, s) => acc + s.count, 0);

  return (
    <PanelCard
      title={t("title")}
      icon={<PieIcon size={16} className="text-cyan-400" />}
      subtitle={t("subtitle", { count: totalProjects })}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2.5">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500">
            {t("status")}
          </div>
          {statusCounts.length === 0 ? (
            <div className="text-sm text-zinc-500">{t("noData")}</div>
          ) : (
            STATUS_ORDER.map((s) => {
              const row = statusCounts.find((x) => x.status === s);
              if (!row || row.count === 0) return null;
              return (
                <Bar
                  key={s}
                  label={t(`labels.${s}`)}
                  count={row.count}
                  total={totalProjects}
                  colorClass={STATUS_COLOR[s]}
                />
              );
            })
          )}
        </div>
        <div className="space-y-2.5">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500">
            {t("category")}
          </div>
          {categoryBreakdown.length === 0 ? (
            <div className="text-sm text-zinc-500">{t("noCategories")}</div>
          ) : (
            categoryBreakdown.map((c) => (
              <div
                key={c.categoryId ?? "none"}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      categoryColorClass(c.color).dot
                    }`}
                  />
                  <span className="text-sm text-zinc-200 truncate">
                    {c.name}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 tabular-nums shrink-0">
                  {t("rowMeta", {
                    projects: c.projectCount,
                    interactions: c.interactions,
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PanelCard>
  );
}
