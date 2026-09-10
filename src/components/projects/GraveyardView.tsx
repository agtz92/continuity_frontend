"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Skull, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { GRAVEYARD_INSIGHT_QUERY } from "@/lib/graphql";
import type { GraveyardInsight, Project, Task } from "@/lib/types";
import { ReviveProjectModal } from "./ReviveProjectModal";
import { GraveTable } from "./GraveTable";
import { Meta } from "@/components/ui/Meta";
import { averageLifespan, dominantCause } from "@/lib/graveyard";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Read-only view of killed projects. Lists each tombstone with its closure
 * notes + AI reflection, a "would restart" metric, and a Revive action. Shows
 * the cached graveyard autopsy (Layer B pattern) when the user has >=3 deaths,
 * otherwise an empty state. "Ask Loop to go deeper" opens the assistant.
 */
export function GraveyardView({
  projects,
  tasks,
  activeUsed,
  activeCap,
  onRevive,
  onOpenAssistant,
}: {
  /** All projects from the dashboard; killed ones are filtered here. */
  projects: Project[];
  /** All tasks from the dashboard; used to surface parked due dates on revive. */
  tasks: Task[];
  activeUsed?: number;
  activeCap?: number;
  /** Saves status + applies the reschedule choice. Resolves true on success. */
  onRevive: (
    project: Project,
    target: "active" | "idea",
    restoreDates: boolean
  ) => Promise<boolean>;
  onOpenAssistant: (initialPrompt?: string) => void;
}) {
  const t = useTranslations("views.graveyard");
  const { data } = useQuery<{ graveyardInsight: GraveyardInsight | null }>(
    GRAVEYARD_INSIGHT_QUERY,
    { fetchPolicy: "cache-and-network" }
  );
  const insight = data?.graveyardInsight ?? null;

  const killed = useMemo(
    () =>
      projects
        .filter((p) => p.status === "killed")
        .sort((a, b) =>
          (b.killedAt ?? "").localeCompare(a.killedAt ?? "")
        ),
    [projects]
  );

  const wouldRestartCount = killed.filter((p) =>
    (p.killedWouldRestart ?? "").trim()
  ).length;

  const [reviving, setReviving] = useState<Project | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Skull size={20} className="text-accent" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>
      <p className="text-sm text-text-muted mb-4">
        {t("subtitle")}
        {killed.length > 0 ? (
          <>
            {" "}
            {t("wouldRestart", {
              count: wouldRestartCount,
              total: killed.length,
            })}
          </>
        ) : null}
      </p>

      <GraveyardAutopsy
        insight={insight}
        killed={killed}
        tasks={tasks}
        onOpenAssistant={onOpenAssistant}
      />

      {killed.length === 0 ? (
        <EmptyState
          className="mt-4"
          title={t("emptyTitle")}
          body={t("empty")}
        />
      ) : (
        <div className="mt-4">
          <GraveTable killed={killed} tasks={tasks} onRevive={setReviving} />
        </div>
      )}

      {reviving && (() => {
        const parked = tasks.filter(
          (tk) => tk.projectId === reviving.id && tk.parkedDueDate
        );
        const nextParked = parked.reduce<string | null>(
          (soonest, tk) =>
            !soonest || (tk.parkedDueDate as string) < soonest
              ? (tk.parkedDueDate as string)
              : soonest,
          null
        );
        return (
        <ReviveProjectModal
          project={reviving}
          activeUsed={activeUsed}
          activeCap={activeCap}
          parkedTaskCount={parked.length}
          nextParkedDate={nextParked}
          onRevive={async (target, restoreDates) => {
            const ok = await onRevive(reviving, target, restoreDates);
            if (ok) setReviving(null);
            return ok;
          }}
          onClose={() => setReviving(null)}
        />
        );
      })()}
    </div>
  );
}

/**
 * El panel de autopsia. El diseño lo quiere abriendo con **una frase
 * discutible** y respaldándola con cifras: el texto lo escribe el modelo
 * (`GraveyardInsight`, cacheado en el backend) y las cifras van debajo, en
 * versalitas, como el respaldo que son.
 *
 * De las dos cifras del artboard —"17 días medios entre el blocker y la muerte"
 * y "2.1 updates antes de rendirse"— **no hay ninguna calculable**: la primera
 * necesitaría saber cuándo apareció el blocker, y los blockers se borran al
 * resolverse; la segunda, contar updates por proyecto muerto en un rango que el
 * dashboard no trae. Van aquí las dos que sí son reales y se derivan de lo que
 * ya viaja: la vida media y el patrón de muerte que más se repite.
 */
function GraveyardAutopsy({
  insight,
  killed,
  tasks,
  onOpenAssistant,
}: {
  insight: GraveyardInsight | null;
  killed: Project[];
  tasks: Task[];
  onOpenAssistant: (initialPrompt?: string) => void;
}) {
  const t = useTranslations("views.graveyard");
  const hasBody = !!insight && insight.body.trim().length > 0;
  const avg = averageLifespan(killed);
  const pattern = dominantCause(killed, tasks);

  return (
    <section className="border-l-[3px] border-accent pl-4 py-1">
      <Meta variant="cintillo" tone="faint" className="flex items-center gap-1.5">
        <Sparkles size={11} /> {t("autopsyLabel")}
        {insight?.isStale ? ` · ${t("autopsyStale")}` : ""}
      </Meta>

      {hasBody ? (
        <p className="mt-2 text-[17px] leading-[1.5] text-text whitespace-pre-wrap max-w-[62ch]">
          {insight!.body}
        </p>
      ) : (
        <p className="mt-2 text-[15px] leading-[1.6] text-text-3 max-w-[62ch]">
          {t("autopsyEmpty")}
        </p>
      )}

      {/* Las cifras que respaldan, solo si hay de dónde sacarlas. */}
      {killed.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          <Meta variant="cintillo" tone="muted">
            {t("avgLifespan", { count: avg })}
          </Meta>
          {pattern && (
            <Meta variant="cintillo" tone="muted">
              {t("patternCount", {
                count: pattern.count,
                cause: t(`cause.${pattern.cause}`),
              })}
            </Meta>
          )}
        </div>
      )}

      <button
        onClick={() => onOpenAssistant(t("askLoopPrompt"))}
        className="mt-3 text-sm text-accent hover:text-accent-hi transition-colors duration-150 ease-out flex items-center gap-1.5"
      >
        <Sparkles size={14} /> {t("askLoop")}
      </button>
    </section>
  );
}
