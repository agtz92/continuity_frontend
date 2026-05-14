"use client";

import { useState } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AnalyticsRange } from "@/lib/types";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { RangeSelector } from "./analytics/RangeSelector";
import { CadencePanel } from "./analytics/CadencePanel";
import { ActivityChart } from "./analytics/ActivityChart";
import { WeekdayHeatmap } from "./analytics/WeekdayHeatmap";
import { TopProjectsPanel } from "./analytics/TopProjectsPanel";
import { StatusBreakdownPanel } from "./analytics/StatusBreakdownPanel";
import { BacklogPanel } from "./analytics/BacklogPanel";
import { SleepingStalePanel } from "./analytics/SleepingStalePanel";
import { IdeaFunnelPanel } from "./analytics/IdeaFunnelPanel";
import { EffortPanel } from "./analytics/EffortPanel";

type ChipId =
  | "activity"
  | "cadence"
  | "status"
  | "backlog"
  | "weekday"
  | "topProjects"
  | "sleeping"
  | "funnel"
  | "effort";

const CHIPS: ChipId[] = [
  "activity",
  "cadence",
  "status",
  "backlog",
  "weekday",
  "funnel",
  "effort",
  "topProjects",
  "sleeping",
];

export function AnalyticsView() {
  const t = useTranslations("analytics");
  const tChips = useTranslations("analytics.chips");
  const tCommon = useTranslations("common");
  const [range, setRange] = useState<AnalyticsRange>("LAST_30_DAYS");
  const [activeChip, setActiveChip] = useState<ChipId>("activity");
  const { analytics, initialLoading, loading, error, refetch } =
    useAnalyticsData(range);

  const renderPanel = (id: ChipId) => {
    if (!analytics) return null;
    switch (id) {
      case "activity":
        return <ActivityChart series={analytics.activitySeries} />;
      case "cadence":
        return <CadencePanel cadence={analytics.cadence} />;
      case "status":
        return (
          <StatusBreakdownPanel
            statusCounts={analytics.statusCounts}
            categoryBreakdown={analytics.categoryBreakdown}
          />
        );
      case "backlog":
        return <BacklogPanel backlog={analytics.backlog} />;
      case "weekday":
        return <WeekdayHeatmap heatmap={analytics.weekdayHeatmap} />;
      case "topProjects":
        return <TopProjectsPanel rows={analytics.topProjects} />;
      case "sleeping":
        return (
          <SleepingStalePanel
            sleeping={analytics.sleepingProjects}
            stale={analytics.staleIdeas}
          />
        );
      case "funnel":
        return <IdeaFunnelPanel funnel={analytics.ideaFunnel} />;
      case "effort":
        return <EffortPanel effort={analytics.effort} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-accent" />
          <h2 className="text-lg font-semibold text-text">{t("title")}</h2>
          {loading && !initialLoading ? (
            <span className="text-xs text-text-muted">{t("refreshing")}</span>
          ) : null}
        </div>
        <RangeSelector range={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="bg-surface border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {t("loadError")}
            </div>
            <div className="text-xs text-text-muted mt-1">{error.message}</div>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 bg-accent hover:opacity-90 text-bg rounded-md font-medium text-xs"
            >
              {tCommon("retry")}
            </button>
          </div>
        </div>
      ) : null}

      {initialLoading || !analytics ? (
        <div className="text-sm text-text-muted py-12 text-center">
          {t("calculating")}
        </div>
      ) : (
        <>
          {/* Mobile: chip selector + one panel */}
          <div className="md:hidden space-y-4">
            <div
              role="tablist"
              className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory -mx-3 px-3 pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {CHIPS.map((id) => {
                const active = activeChip === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveChip(id)}
                    className={`snap-start shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? "bg-accent text-bg border-accent"
                        : "bg-surface text-text-muted border-border"
                    }`}
                  >
                    {tChips(id)}
                  </button>
                );
              })}
            </div>

            <div key={activeChip} className="analytics-fade-in">
              {renderPanel(activeChip)}
            </div>
          </div>

          {/* Desktop: full grid as before */}
          <div className="hidden md:block space-y-4">
            <CadencePanel cadence={analytics.cadence} />
            <ActivityChart series={analytics.activitySeries} />
            <div className="grid lg:grid-cols-2 gap-4">
              <TopProjectsPanel rows={analytics.topProjects} />
              <WeekdayHeatmap heatmap={analytics.weekdayHeatmap} />
            </div>
            <BacklogPanel backlog={analytics.backlog} />
            <StatusBreakdownPanel
              statusCounts={analytics.statusCounts}
              categoryBreakdown={analytics.categoryBreakdown}
            />
            <SleepingStalePanel
              sleeping={analytics.sleepingProjects}
              stale={analytics.staleIdeas}
            />
            <div className="grid lg:grid-cols-2 gap-4">
              <IdeaFunnelPanel funnel={analytics.ideaFunnel} />
              <EffortPanel effort={analytics.effort} />
            </div>
          </div>
        </>
      )}

    </div>
  );
}
