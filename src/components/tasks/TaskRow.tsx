"use client";

import { CalendarPlus, CheckCircle2, X } from "lucide-react";
import type { Project, Task } from "@/lib/types";
import { isDueToday, isOverdue } from "@/lib/date";

/**
 * The bordered task row used inside the TasksView buckets. Shows checkbox + title +
 * project/due meta + delete button. When `onSchedule` is provided and the task has no
 * due date, an "Add date" inline action appears in the meta line.
 */
export function TaskRow({
  task: t,
  project,
  onToggle,
  onDelete,
  onSchedule,
}: {
  task: Task;
  project: Project | undefined;
  onToggle: (t: Task) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onSchedule?: (t: Task) => void;
}) {
  const overdue = !t.done && isOverdue(t.dueDate);
  const dueToday = !t.done && isDueToday(t.dueDate);
  return (
    <div
      className={`bg-zinc-900 border rounded-lg p-3 flex items-center gap-3 group ${
        overdue
          ? "border-red-500/30"
          : dueToday
          ? "border-orange-500/30"
          : "border-zinc-800"
      }`}
    >
      <button
        onClick={() => onToggle(t)}
        className={
          t.done ? "text-emerald-400" : "text-zinc-600 hover:text-zinc-400"
        }
        aria-label={t.done ? "Mark as not done" : "Mark as done"}
      >
        <CheckCircle2 size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <div className={t.done ? "line-through text-zinc-500" : "text-zinc-100"}>
          {t.title}
        </div>
        <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-2 mt-0.5">
          {project && <span>{project.name}</span>}
          {t.dueDate ? (
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
                ? "Due today"
                : new Date(t.dueDate).toLocaleDateString()}
            </span>
          ) : onSchedule ? (
            <button
              onClick={() => onSchedule(t)}
              className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 hover:underline"
            >
              <CalendarPlus size={12} /> Add date
            </button>
          ) : null}
        </div>
      </div>
      <button
        onClick={() => onDelete(t.id)}
        className="text-zinc-600 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
        aria-label="Delete task"
      >
        <X size={16} />
      </button>
    </div>
  );
}
