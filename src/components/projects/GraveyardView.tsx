"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { HeartPulse, Skull, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { GRAVEYARD_INSIGHT_QUERY } from "@/lib/graphql";
import type { GraveyardInsight, Project, Task } from "@/lib/types";
import { ProjectClosureNotes } from "./ProjectClosureNotes";
import { ReviveProjectModal } from "./ReviveProjectModal";
import { daysSince } from "@/lib/date";

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
  const locale = useLocale();
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
        <Skull size={20} className="text-red-500" />
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

      <GraveyardAutopsy insight={insight} onOpenAssistant={onOpenAssistant} />

      {killed.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center mt-4">
          <Skull size={28} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {killed.map((p) => {
            const lifespan = daysSince(p.created) ?? 0;
            return (
              <div
                key={p.id}
                className="bg-surface border border-border border-l-4 border-l-red-500/60 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text truncate">{p.name}</h3>
                    <div className="text-xs text-text-muted mt-0.5">
                      {t("lived", { days: lifespan })}
                      {p.killedAt ? (
                        <>
                          {" · "}
                          {t("killedOn", {
                            date: new Date(p.killedAt).toLocaleDateString(
                              locale,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            ),
                          })}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={() => setReviving(p)}
                    className="shrink-0 px-3 py-1.5 text-xs bg-accent hover:opacity-90 text-bg rounded-md font-medium flex items-center gap-1.5"
                  >
                    <HeartPulse size={12} /> {t("revive")}
                  </button>
                </div>
                <ProjectClosureNotes project={p} />
              </div>
            );
          })}
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

function GraveyardAutopsy({
  insight,
  onOpenAssistant,
}: {
  insight: GraveyardInsight | null;
  onOpenAssistant: (initialPrompt?: string) => void;
}) {
  const t = useTranslations("views.graveyard");
  const hasBody = !!insight && insight.body.trim().length > 0;

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-2">
        <Sparkles size={12} /> {t("autopsyLabel")}
      </div>
      {hasBody ? (
        <>
          <div className="text-sm text-text whitespace-pre-wrap">
            {insight!.body}
          </div>
          {insight!.isStale ? (
            <p className="text-xs text-text-muted mt-2">{t("autopsyStale")}</p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-text-muted">{t("autopsyEmpty")}</p>
      )}
      <button
        onClick={() => onOpenAssistant(t("askLoopPrompt"))}
        className="mt-3 text-sm text-accent hover:opacity-80 flex items-center gap-1.5"
      >
        <Sparkles size={14} /> {t("askLoop")}
      </button>
    </div>
  );
}
