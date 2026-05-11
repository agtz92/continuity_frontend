"use client";

import { TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProjectInteractionRow } from "@/lib/types";
import { PanelCard } from "./PanelCard";

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="text-text-muted text-xs flex items-center gap-0.5">
        <Minus size={12} />
        0
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="text-accent text-xs flex items-center gap-0.5">
        <ArrowUp size={12} />+{value}
      </span>
    );
  }
  return (
    <span className="text-rose-400 text-xs flex items-center gap-0.5">
      <ArrowDown size={12} />
      {value}
    </span>
  );
}

export function TopProjectsPanel({ rows }: { rows: ProjectInteractionRow[] }) {
  const t = useTranslations("analytics.topProjects");
  return (
    <PanelCard
      title={t("title")}
      icon={<TrendingUp size={16} className="text-accent-2" />}
      subtitle={t("subtitle")}
    >
      {rows.length === 0 ? (
        <div className="text-sm text-text-muted py-4">{t("empty")}</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.projectId}
              className="flex items-center justify-between gap-3 bg-bg/50 border border-border rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm text-text truncate">{r.name}</div>
                <div className="text-[11px] text-text-muted">{r.status}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Delta value={r.deltaVsPrev} />
                <div className="text-base font-semibold text-text tabular-nums">
                  {r.interactions}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
