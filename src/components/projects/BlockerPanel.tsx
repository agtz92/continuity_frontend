"use client";

import { useTranslations } from "next-intl";

import type { Task } from "@/lib/types";
import { daysSince } from "@/lib/date";
import { Meta } from "../ui/Meta";
import { BlockerBadge } from "../ui/BlockerBadge";

/**
 * Los bloqueos abiertos del proyecto, por encima de todo lo demás.
 *
 * El diseño los sube arriba de la bitácora, y tiene razón: si algo está
 * detenido, es lo único que hace falta leer para saber qué hacer. Lo que se
 * pinta grande es **la razón**, no el estado — "bloqueado" no desatasca nada.
 *
 * El diseño dibuja dos acciones, `Resolver ahora` y `Delegar`. **Delegar no
 * existe**: no hay asignación ni personas en el modelo, así que inventármela
 * sería dibujar un botón que no puede hacer nada. Queda solo la que sí
 * funciona, que abre la tarea donde se retira el blocker.
 */
export function BlockerPanel({
  blockedTasks,
  onOpenTask,
}: {
  /** Tareas abiertas con al menos un blocker. */
  blockedTasks: Task[];
  onOpenTask: (t: Task) => void;
}) {
  const t = useTranslations("views.projects.blockers");

  if (blockedTasks.length === 0) return null;

  return (
    <section>
      <Meta variant="cintillo" tone="muted" className="block mb-2">
        {t("title", { count: blockedTasks.length })}
      </Meta>

      <div className="space-y-2">
        {blockedTasks.map((task) => {
          const oldest = [...task.blockers].sort((a, b) =>
            a.created.localeCompare(b.created)
          )[0];
          const since =
            daysSince(task.blockedSince ?? oldest?.created ?? null) ?? 0;
          const reason =
            task.blockedReason ||
            task.blockers.find((b) => b.externalDescription)
              ?.externalDescription;

          return (
            <div key={task.id} className="flex items-start gap-3">
              <BlockerBadge
                className="flex-1 min-w-0"
                since={since}
                reason={reason || task.title}
              />
              <button
                type="button"
                onClick={() => onOpenTask(task)}
                className="shrink-0 mt-2 px-3 py-1.5 text-xs rounded-md border border-signal-a50 text-signal hover:bg-signal-a12 transition-colors duration-150 ease-out"
              >
                {t("resolve")}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
