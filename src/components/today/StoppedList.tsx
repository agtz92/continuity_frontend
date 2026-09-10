"use client";

import { useTranslations } from "next-intl";

import type { Project, Task } from "@/lib/types";
import { projectBlockedDays } from "@/lib/cooling";
import { Spine } from "../ui/Spine";
import { Meta } from "../ui/Meta";
import { BlockerBadge } from "../ui/BlockerBadge";

/**
 * "Detenido por algo" — lo que está atorado, lo más viejo arriba.
 *
 * Un proyecto parado por un blocker no es lo mismo que uno abandonado, y por
 * eso tiene bloque propio y no se mezcla con "se están enfriando". Lo que se
 * pinta grande es **la razón**, no el estado: "bloqueado" no desatasca nada,
 * "esperando el contrato firmado" sí.
 */
export function StoppedList({
  projects,
  tasks,
  onJumpToProject,
}: {
  projects: Project[];
  tasks: Task[];
  onJumpToProject: (p: Project) => void;
}) {
  const t = useTranslations("views.today.stopped");

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-2">
        <Meta variant="cintillo" tone="muted">
          {t("title")}
        </Meta>
        <Meta tone="faint">{projects.length}</Meta>
      </div>

      <div className="divide-y divide-line-08 border-y border-line-08">
        {projects.map((p) => {
          const openTasks = tasks.filter((x) => x.projectId === p.id && !x.done);
          const blockedCount = openTasks.filter(
            (x) => (x.blockers?.length ?? 0) > 0
          ).length;
          const reason = openTasks
            .flatMap((x) => x.blockers ?? [])
            .sort((a, b) => a.created.localeCompare(b.created))
            .find((b) => b.externalDescription)?.externalDescription;

          return (
            <div key={p.id} className="relative pl-3 py-2.5">
              <Spine status={p.status} priority={p.priority} blocked />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onJumpToProject(p)}
                  className="text-sm font-medium text-text hover:text-accent transition-colors duration-150 ease-out"
                >
                  {p.name}
                </button>
                <BlockerBadge compact label since={projectBlockedDays(p)} />
                {blockedCount > 1 && (
                  <Meta tone="faint">{t("tasks", { count: blockedCount })}</Meta>
                )}
              </div>
              {reason && (
                <p className="mt-0.5 text-xs text-text-3 truncate">{reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
