"use client";

import { Check, Repeat } from "lucide-react";
import type { Category, Project, Task } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import {
  OVERLOAD_HOURS,
  type DayLoad,
  type ProjectRollup,
  type RoutineItem,
} from "@/lib/calendar";

/** Interactions shared by every calendar grid. */
export interface CalendarHandlers {
  onOpenProject: (p: Project) => void;
  onEditTask: (t: Task) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onCompleteOccurrence: (
    routineId: string,
    scheduledDate: string
  ) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
}

export const projectChipClass = (
  project: Project | null,
  categoryById: Map<string, Category>
): string => {
  const cat = project?.categoryId ? categoryById.get(project.categoryId) : null;
  if (cat) return categoryColorClass(cat.color).chip;
  // No category → themed accent-2 tint (palette-safe via color-mix).
  return "bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] text-accent-2 border-[color-mix(in_srgb,var(--accent-2)_32%,transparent)]";
};

export const ROUTINE_CHIP =
  "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent border-[color-mix(in_srgb,var(--accent)_28%,transparent)]";

/** One chip per project for a day (default view), with a task count badge. */
export function ProjectChip({
  rollup,
  categoryById,
  onOpenProject,
}: {
  rollup: ProjectRollup;
  categoryById: Map<string, Category>;
  onOpenProject: (p: Project) => void;
}) {
  const { project, tasks } = rollup;
  return (
    <button
      type="button"
      onClick={() => project && onOpenProject(project)}
      disabled={!project}
      title={project?.name}
      className={`w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded border flex items-center gap-1.5 ${projectChipClass(
        project,
        categoryById
      )} ${project ? "hover:opacity-80" : ""}`}
    >
      <span className="truncate flex-1">{project?.name ?? ""}</span>
      <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,currentColor_22%,transparent)] px-1.5 tabular-nums">
        {tasks.length}
      </span>
    </button>
  );
}

/** A single task (Ver tasks on, or tasks with no project). */
export function TaskChip({
  task,
  onEditTask,
  onToggleTask,
}: {
  task: Task;
  onEditTask: (t: Task) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
}) {
  return (
    <div className="w-full text-[11px] leading-tight px-1.5 py-1 rounded border bg-surface border-border text-text flex items-center gap-1.5 group">
      <button
        type="button"
        onClick={() => onToggleTask(task)}
        aria-label={task.title}
        className="shrink-0 text-text-muted hover:text-accent"
      >
        <Check size={12} />
      </button>
      <button
        type="button"
        onClick={() => onEditTask(task)}
        title={task.title}
        className="truncate flex-1 text-left hover:opacity-80"
      >
        {task.title}
      </button>
      {task.effortHours != null && (
        <span className="shrink-0 text-text-muted tabular-nums">
          {task.effortHours}h
        </span>
      )}
    </div>
  );
}

/** A routine occurrence chip with a complete/uncomplete toggle. */
export function RoutineChip({
  item,
  onCompleteOccurrence,
  onUncompleteOccurrence,
}: {
  item: RoutineItem;
  onCompleteOccurrence: (
    routineId: string,
    scheduledDate: string
  ) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
}) {
  const toggle = () => {
    if (item.completed && item.occurrenceId) {
      onUncompleteOccurrence(item.occurrenceId);
    } else if (!item.completed) {
      onCompleteOccurrence(item.routine.id, item.scheduledDate);
    }
  };
  return (
    <div
      className={`w-full text-[11px] leading-tight px-1.5 py-1 rounded border flex items-center gap-1.5 ${ROUTINE_CHIP} ${
        item.completed ? "opacity-55" : ""
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={item.routine.title}
        className="shrink-0 hover:opacity-80"
      >
        {item.completed ? <Check size={12} /> : <Repeat size={12} />}
      </button>
      <span
        className={`truncate flex-1 ${item.completed ? "line-through" : ""}`}
        title={item.routine.title}
      >
        {item.routine.title}
      </span>
    </div>
  );
}

/** Thin per-day load bar; width and color scale with estimated hours. */
export function LoadBar({ load }: { load: DayLoad }) {
  const color =
    load.level === "over"
      ? "bg-red-500"
      : load.level === "busy"
        ? "bg-amber-500"
        : "bg-[color-mix(in_srgb,var(--accent)_75%,transparent)]";
  const pct =
    load.hours <= 0
      ? 0
      : Math.max(8, Math.min(100, Math.round((load.hours / OVERLOAD_HOURS) * 100)));
  return (
    <div
      className="h-1 rounded-full bg-border overflow-hidden"
      title={`${load.hours}h`}
    >
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
