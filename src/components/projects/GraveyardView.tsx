"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { HeartPulse, Skull, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import { GRAVEYARD_INSIGHT_QUERY } from "@/lib/graphql";
import type { GraveyardInsight, Project } from "@/lib/types";
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
  activeUsed,
  activeCap,
  onRevive,
  onOpenAssistant,
}: {
  /** All projects from the dashboard; killed ones are filtered here. */
  projects: Project[];
  activeUsed?: number;
  activeCap?: number;
  /** Saves status. Resolves true on success. */
  onRevive: (project: Project, target: "active" | "idea") => Promise<boolean>;
  onOpenAssistant: () => void;
}) {
  const locale = useLocale();
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
        <h2 className="text-lg font-semibold">Project Graveyard</h2>
      </div>
      <p className="text-sm text-text-muted mb-4">
        A library of what didn&apos;t work so you don&apos;t repeat it.
        {killed.length > 0 ? (
          <>
            {" "}
            Would restart {wouldRestartCount} of {killed.length}.
          </>
        ) : null}
      </p>

      <GraveyardAutopsy insight={insight} onOpenAssistant={onOpenAssistant} />

      {killed.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center mt-4">
          <Skull size={28} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">
            Nothing buried here yet. Projects you kill with intention land in the
            graveyard, notes and all.
          </p>
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
                      Lived {lifespan} days
                      {p.killedAt ? (
                        <>
                          {" · killed "}
                          {new Date(p.killedAt).toLocaleDateString(locale, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={() => setReviving(p)}
                    className="shrink-0 px-3 py-1.5 text-xs bg-accent hover:opacity-90 text-bg rounded-md font-medium flex items-center gap-1.5"
                  >
                    <HeartPulse size={12} /> Revive
                  </button>
                </div>
                <ProjectClosureNotes project={p} />
              </div>
            );
          })}
        </div>
      )}

      {reviving && (
        <ReviveProjectModal
          project={reviving}
          activeUsed={activeUsed}
          activeCap={activeCap}
          onRevive={async (target) => {
            const ok = await onRevive(reviving, target);
            if (ok) setReviving(null);
            return ok;
          }}
          onClose={() => setReviving(null)}
        />
      )}
    </div>
  );
}

function GraveyardAutopsy({
  insight,
  onOpenAssistant,
}: {
  insight: GraveyardInsight | null;
  onOpenAssistant: () => void;
}) {
  const hasBody = !!insight && insight.body.trim().length > 0;

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-2">
        <Sparkles size={12} /> Autopsy
      </div>
      {hasBody ? (
        <>
          <div className="text-sm text-text whitespace-pre-wrap">
            {insight!.body}
          </div>
          {insight!.isStale ? (
            <p className="text-xs text-text-muted mt-2">
              This pattern is out of date. It will refresh next time a project is
              killed.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-text-muted">
          Kill 3 projects with intention and Loop will look for the pattern
          across them. So far there isn&apos;t enough to go on.
        </p>
      )}
      <button
        onClick={onOpenAssistant}
        className="mt-3 text-sm text-accent hover:opacity-80 flex items-center gap-1.5"
      >
        <Sparkles size={14} /> Ask Loop to go deeper
      </button>
    </div>
  );
}
