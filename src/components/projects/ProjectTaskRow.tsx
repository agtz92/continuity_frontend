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

import { Clock, Edit2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Task } from "@/lib/types";
import { isOverdue } from "@/lib/date";
import { TaskToggle } from "../tasks/TaskToggle";

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
  const containerClass = interactive
    ? "flex items-center gap-2 group py-1 px-2 rounded-md hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] transition-colors"
    : "flex items-center gap-2 group py-1";
  return (
    <div className={containerClass}>
      <TaskToggle
        done={task.done}
        overdue={overdue}
        onToggle={() => onToggleTask(task)}
        label={task.done ? tRow("markNotDone") : tRow("markDone")}
      />
      <span
        className={`text-sm flex-1 ${
          task.done ? "line-through text-text-muted" : "text-text"
        }`}
      >
        {task.title}
      </span>
      {task.dueDate && (
        <span
          className={`text-xs ${
            overdue ? "text-red-400 font-medium" : "text-text-muted"
          }`}
        >
          {new Date(task.dueDate).toLocaleDateString(locale)}
        </span>
      )}
      {task.effortHours != null && (
        <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
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
  );
}
