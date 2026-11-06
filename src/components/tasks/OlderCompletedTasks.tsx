"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useOlderCompletedTasks } from "@/hooks/useOlderCompletedTasks";
import type { Task } from "@/lib/types";

/**
 * "Ver completadas anteriores": el final de una lista de completadas.
 *
 * El dashboard solo trae las completadas de los últimos
 * `DASHBOARD_DONE_TASK_DAYS` días; esto pide las anteriores al tocar el botón.
 * `count` (de `project.olderDoneCount`) dice cuántas hay; sin él (la vista de
 * Tasks, que mezcla proyectos y sueltas) el botón no lleva número y se oculta
 * cuando una página vuelve incompleta.
 *
 * `renderItem` recibe `onReopened`: llámalo tras reabrir una de estas tareas
 * para vaciar la lista (la tarea vuelve al dashboard con el refetch).
 */
export function OlderCompletedTasks({
  projectId,
  count,
  excludeIds,
  renderItem,
  className = "text-xs text-accent hover:opacity-80 mt-1 inline-flex items-center gap-1",
}: {
  projectId?: string;
  count?: number;
  /** Ids ya pintados desde la caché (la ventana del servidor y la del cliente
   *  no coinciden al milisegundo). */
  excludeIds?: Set<string>;
  renderItem: (task: Task, onReopened: () => void) => ReactNode;
  className?: string;
}) {
  const t = useTranslations("completedHistory");
  const older = useOlderCompletedTasks(projectId);

  if (count === 0) return null;
  const visible = excludeIds ? older.items.filter((x) => !excludeIds.has(x.id)) : older.items;
  const remaining = count === undefined ? undefined : Math.max(0, count - older.items.length);
  const canLoad =
    !older.exhausted && (remaining === undefined || remaining > 0);

  const label = older.loading
    ? t("loading")
    : older.error
      ? t("error")
      : older.started
        ? t("loadMore")
        : remaining !== undefined
          ? t("showCount", { count: remaining })
          : t("show");

  return (
    <>
      {visible.map((task) => (
        <Fragment key={task.id}>{renderItem(task, older.reset)}</Fragment>
      ))}
      {canLoad && (
        <button
          type="button"
          disabled={older.loading}
          onClick={(e) => {
            e.stopPropagation();
            void older.load();
          }}
          className={className}
        >
          {label}
        </button>
      )}
    </>
  );
}
