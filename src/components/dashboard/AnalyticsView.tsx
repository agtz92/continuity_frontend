"use client";

import { useState } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
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

export function AnalyticsView() {
  const [range, setRange] = useState<AnalyticsRange>("LAST_30_DAYS");
  const { analytics, initialLoading, loading, error, refetch } =
    useAnalyticsData(range);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Analíticas</h2>
          {loading && !initialLoading ? (
            <span className="text-xs text-zinc-500">actualizando…</span>
          ) : null}
        </div>
        <RangeSelector range={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-300">
              No se pudieron cargar las analíticas
            </div>
            <div className="text-xs text-zinc-400 mt-1">{error.message}</div>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-md font-medium text-xs"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : null}

      {initialLoading || !analytics ? (
        <div className="text-sm text-zinc-500 py-12 text-center">
          Calculando analíticas…
        </div>
      ) : (
        <div className="space-y-4">
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
      )}
    </div>
  );
}
