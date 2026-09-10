"use client";

import { useState } from "react";
import { AlertCircle, BarChart3, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  Activity,
  AnalyticsRange,
  Category,
  Project,
  Task,
} from "@/lib/types";
import { Meta } from "@/components/ui/Meta";
import { AnalyticsHeadline } from "./analytics/Headline";
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
import { LoopPanel } from "./analytics/LoopPanel";

type ChipId =
  | "activity"
  | "loop"
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
  "loop",
  "cadence",
  "status",
  "backlog",
  "weekday",
  "funnel",
  "effort",
  "topProjects",
  "sleeping",
];

export function AnalyticsView({
  projects,
  tasks,
  activities,
  categories,
}: {
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  categories: Category[];
}) {
  const t = useTranslations("analytics");
  const tChips = useTranslations("analytics.chips");
  const tCommon = useTranslations("common");
  const [range, setRange] = useState<AnalyticsRange>("LAST_30_DAYS");
  const [activeChip, setActiveChip] = useState<ChipId>("activity");
  // Los doce paneles siguen ahí, plegados (DP-08): no se borra nada hasta poder
  // medir si alguien baja. El selector de rango va con ellos, porque es suyo.
  const [showPanels, setShowPanels] = useState(false);
  const { analytics, initialLoading, loading, error, refetch } =
    useAnalyticsData(range);

  const renderPanel = (id: ChipId) => {
    if (!analytics) return null;
    switch (id) {
      case "activity":
        return <ActivityChart series={analytics.activitySeries} />;
      case "loop":
        return <LoopPanel loop={analytics.loop} />;
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
      </div>

      {/* La cabecera editorial: se deriva de datos que ya están en memoria, así
          que se pinta aunque la consulta de analítica siga cargando. */}
      <AnalyticsHeadline
        projects={projects}
        tasks={tasks}
        activities={activities}
        categories={categories}
      />

      {/* La puerta a los doce paneles. Era un cintillo de 11px que no invitaba a
          nada; ahora es una banda con espina, titular y **una lista de lo que
          hay detrás** — lo que de verdad invita no es el botón, es saber qué te
          espera al abrirlo. */}
      <button
        type="button"
        onClick={() => setShowPanels((v) => !v)}
        aria-expanded={showPanels}
        className="group relative w-full text-left flex items-center gap-4 border-y border-line-08 py-5 pl-4 pr-3 hover:bg-accent-a12 transition-colors duration-150 ease-out"
      >
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent"
        />
        <span className="flex-1 min-w-0">
          <span className="block font-display-app text-xl leading-tight text-text">
            {showPanels ? t("hideDetail") : t("showDetail")}
          </span>
          <Meta tone="faint" className="block mt-1">
            {t("detailHint")}
          </Meta>
        </span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-text-4 group-hover:text-accent transition-transform duration-150 ease-out ${
            showPanels ? "rotate-180" : ""
          }`}
        />
      </button>

      {error ? (
        <div className="bg-surface border border-signal-a50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-signal shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-signal ">
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

      {!showPanels ? null : initialLoading || !analytics ? (
        <div className="text-sm text-text-muted py-12 text-center">
          {t("calculating")}
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <RangeSelector range={range} onChange={setRange} />
          </div>
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
            <LoopPanel loop={analytics.loop} />
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
