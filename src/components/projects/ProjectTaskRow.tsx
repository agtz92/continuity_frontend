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

import { CheckCircle2, Clock, Edit2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Task } from "@/lib/types";

interface ProjectTaskRowProps {
  task: Task;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void | Promise<void>;
  /** Añade hover + padding (uso en lista). El modal de detalle la omite. */
  interactive?: boolean;
}

export function ProjectTaskRow({
  task,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  interactive = false,
}: ProjectTaskRowProps) {
  const tCard = useTranslations("views.projects.card");
  const locale = useLocale();
  const containerClass = interactive
    ? "flex items-center gap-2 group py-1 px-2 rounded-md hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] transition-colors"
    : "flex items-center gap-2 group py-1";
  return (
    <div className={containerClass}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleTask(task);
        }}
        className={`shrink-0 ${
          task.done ? "text-accent" : "text-text-muted hover:text-text-muted"
        }`}
      >
        <CheckCircle2 size={16} />
      </button>
      <span
        className={`text-sm flex-1 ${
          task.done ? "line-through text-text-muted" : "text-text"
        }`}
      >
        {task.title}
      </span>
      {task.dueDate && (
        <span className="text-xs text-text-muted">
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteTask(task.id);
        }}
        className="text-text-muted hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
        aria-label={tCard("deleteTaskAria")}
      >
        <X size={14} />
      </button>
    </div>
  );
}
