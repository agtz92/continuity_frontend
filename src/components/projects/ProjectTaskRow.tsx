"use client";

/**
 * ProjectTaskRow — fila de tarea compacta del detalle de proyecto (toggle,
 * título, fecha/esfuerzo, editar, borrar). De-duplica el `renderTaskRow` que
 * existía idéntico en `views/ProjectRow.tsx` y `projects/ProjectDetailModal.tsx`
 * (ver AUDITORIA_CODIGO.md).
 *
 * Distinta del `tasks/TaskRow.tsx` (la fila con borde de TasksView). `interactive`
 * añade hover/padding (uso dentro de la lista de proyectos); el modal de detalle
 * la usa sin eso. Los handlers hacen `stopPropagation` siempre: necesario cuando
 * la fila vive dentro de un contenedor clickeable (ProjectRow), inocuo en el modal.
 */

import { useState } from "react";
import { Clock, Edit2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Task } from "@/lib/types";
import { daysSince, isOverdue } from "@/lib/date";
import { BlockerBadge } from "@/components/ui/BlockerBadge";
import { BlockedTaskDialog } from "../tasks/BlockedTaskDialog";
import { TaskToggle } from "../tasks/TaskToggle";

/** Trama de "detenido". Misma que en `tasks/TaskRow.tsx`: una tarea bloqueada
 *  se ve igual esté donde esté, dentro del proyecto o en la lista general. */
const BLOCKED_HATCH = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--signal-a04) 0 6px, transparent 6px 14px)",
} as const;

interface ProjectTaskRowProps {
  task: Task;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  // Delete moved into the edit modal; the pencil opens it. Kept optional so
  // existing call sites don't break.
  onDeleteTask?: (id: string) => void | Promise<void>;
  /** Añade hover + padding (uso en lista). El modal de detalle la omite. */
  interactive?: boolean;
}

export function ProjectTaskRow({
  task,
  onToggleTask,
  onEditTask,
  interactive = false,
}: ProjectTaskRowProps) {
  const tCard = useTranslations("views.projects.card");
  const tRow = useTranslations("taskRow");
  const locale = useLocale();
  const overdue = !task.done && isOverdue(task.dueDate);
  const isBlocked = !task.done && task.blockers.length > 0;
  const blockReason =
    task.blockedReason ||
    task.blockers.find((b) => b.externalDescription)?.externalDescription;
  const blockedDays = isBlocked
    ? (daysSince(task.blockedSince ?? task.blockers.map((b) => b.created).sort()[0]) ?? 0)
    : 0;
  const [askBlocked, setAskBlocked] = useState(false);
  const containerClass = interactive
    ? "flex items-center gap-2 group py-1 px-2 rounded-md hover:bg-accent-a12 transition-colors duration-150 ease-out"
    : "flex items-center gap-2 group py-1";
  return (
    <>
      {askBlocked && (
        <BlockedTaskDialog
          task={task}
          onClose={() => setAskBlocked(false)}
          onResolve={() => onToggleTask(task)}
        />
      )}
    <div
      // Bloqueada: trama en toda la fila + espina de señal a la izquierda.
      // No basta el chip — tiene que leerse detenida de un vistazo.
      style={isBlocked ? BLOCKED_HATCH : undefined}
      className={`${containerClass}${
        isBlocked ? " border-l-[3px] border-signal pl-2 -ml-[3px]" : ""
      }`}
      title={isBlocked ? blockReason : undefined}
    >
      <TaskToggle
        done={task.done}
        overdue={overdue}
        blocked={isBlocked}
        onToggle={() =>
          // Mismo guardarraíl que en `tasks/TaskRow`: cerrar algo bloqueado
          // pregunta primero qué pasó con el bloqueo.
          !task.done && isBlocked ? setAskBlocked(true) : onToggleTask(task)
        }
        label={task.done ? tRow("markNotDone") : tRow("markDone")}
      />
      <span
        className={`text-sm flex-1 ${
          task.done ? "line-through text-text-muted" : "text-text"
        }`}
      >
        {task.title}
      </span>
      {isBlocked && (
        <span className="inline-flex items-center gap-1.5 min-w-0 shrink">
          <BlockerBadge compact since={blockedDays} />
          {blockReason && (
            <span className="truncate text-xs text-text-3 hidden sm:inline">
              {blockReason}
            </span>
          )}
        </span>
      )}
      {task.dueDate && (
        <span
          className={`text-xs ${
            overdue ? "text-signal font-medium" : "text-text-muted"
          }`}
        >
          {new Date(task.dueDate).toLocaleDateString(locale)}
        </span>
      )}
      {task.effortHours != null && (
        <span className="text-xs px-2 py-0.5 rounded border bg-line-08 text-text-3 border-line-14 inline-flex items-center gap-1">
          <Clock size={10} />
          {task.effortHours}h
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEditTask(task);
        }}
        className="text-text-muted hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
        aria-label={tCard("editTaskAria")}
      >
        <Edit2 size={14} />
      </button>
    </div>
    </>
  );
}
