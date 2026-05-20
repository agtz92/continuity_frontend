"use client";

import { CalendarPlus, CheckCircle2, Clock, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Project, Task } from "@/lib/types";
import { isDueToday, isOverdue } from "@/lib/date";

/**
 * Bordered task row used inside the TasksView buckets. Shows checkbox + title +
 * project/due meta + delete button. When `onSchedule` is provided and the task
 * has no due date, an "Add date" inline action appears in the meta line.
 */
export function TaskRow({
  task,
  project,
  onToggle,
  onDelete,
  onSchedule,
  onEdit,
}: {
  task: Task;
  project: Project | undefined;
  onToggle: (t: Task) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onSchedule?: (t: Task) => void;
  onEdit?: (t: Task) => void;
}) {
  const t = useTranslations("taskRow");
  const locale = useLocale();
  const overdue = !task.done && isOverdue(task.dueDate);
  const dueToday = !task.done && isDueToday(task.dueDate);
  return (
    <div
      className={`bg-surface border rounded-lg p-3 flex items-center gap-3 group ${
        overdue
          ? "border-red-500/30"
          : dueToday
          ? "border-orange-500/30"
          : "border-border"
      }`}
    >
      <button
        onClick={() => onToggle(task)}
        className={
          task.done ? "text-accent" : "text-text-muted hover:text-text-muted"
        }
        aria-label={task.done ? t("markNotDone") : t("markDone")}
        title={task.done ? t("markNotDone") : t("markDone")}
      >
        <CheckCircle2 size={18} />
      </button>
      <div
        className={`flex-1 min-w-0 ${onEdit ? "cursor-pointer" : ""}`}
        onClick={onEdit ? () => onEdit(task) : undefined}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={task.done ? "line-through text-text-muted" : "text-text"}>
            {task.title}
          </span>
          {task.effortHours != null && (
            <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
              <Clock size={10} />
              {task.effortHours}h
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted flex flex-wrap items-center gap-x-2 mt-0.5">
          {project && <span>{project.name}</span>}
          {task.dueDate ? (
            <span
              className={
                overdue
                  ? "text-red-400"
                  : dueToday
                  ? "text-orange-400"
                  : ""
              }
            >
              · {dueToday
                ? t("dueToday")
                : new Date(task.dueDate).toLocaleDateString(locale)}
            </span>
          ) : onSchedule ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(task);
              }}
              className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:underline"
              title={t("addDate")}
            >
              <CalendarPlus size={12} /> {t("addDate")}
            </button>
          ) : null}
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="text-text-muted hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
        aria-label={t("deleteAria")}
        title={t("deleteAria")}
      >
        <X size={16} />
      </button>
    </div>
  );
}
