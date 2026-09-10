"use client";

import { useTranslations } from "next-intl";

import type { Task } from "@/lib/types";
import { daysSince } from "@/lib/date";
import { Meta } from "@/components/ui/Meta";
import { BlockerBadge } from "@/components/ui/BlockerBadge";

/**
 * El riel de "detenido": tareas bloqueadas **sin fecha**, sobre la rejilla.
 *
 * Es la corrección de un punto ciego del calendario. Una tarea sin día no
 * aparece en ninguna casilla, así que lo que está atorado y además sin
 * programar era invisible justo en la pantalla donde uno decide qué hacer esta
 * semana. El artboard las pone en una fila propia arriba, y tiene razón: no
 * pertenecen a ningún día precisamente porque nadie les ha puesto uno.
 *
 * Las bloqueadas **con** fecha no salen aquí: ya están en su casilla, con su
 * trama. Repetirlas sería contarlas dos veces.
 */
export function BlockedRail({
  tasks,
  onEditTask,
}: {
  /** Todas las tareas visibles del calendario. El filtro se hace aquí. */
  tasks: Task[];
  onEditTask: (t: Task) => void;
}) {
  const t = useTranslations("views.calendar");

  const stuck = tasks
    .filter(
      (task) =>
        !task.done && !task.dueDate && (task.blockers?.length ?? 0) > 0
    )
    .sort((a, b) =>
      (a.blockedSince ?? a.created).localeCompare(b.blockedSince ?? b.created)
    );

  if (stuck.length === 0) return null;

  return (
    <section className="mb-3">
      <Meta variant="cintillo" tone="muted" className="block mb-1.5">
        {t("stuckRail", { count: stuck.length })}
      </Meta>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stuck.map((task) => {
          const oldest = [...task.blockers].sort((a, b) =>
            a.created.localeCompare(b.created)
          )[0];
          const since =
            daysSince(task.blockedSince ?? oldest?.created ?? null) ?? 0;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onEditTask(task)}
              title={task.blockedReason || task.title}
              className="shrink-0 max-w-[15rem] text-left"
            >
              <BlockerBadge
                since={since}
                reason={task.title}
                className="hover:bg-signal-a04 transition-colors duration-150 ease-out"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
