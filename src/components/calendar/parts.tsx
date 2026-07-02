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

/**
 * Chip sizing: "sm" is the dense Week/Month cell scale; "md" is the roomier
 * row scale used by the Day list and the Month agenda panel (mirrors mobile).
 */
export type ChipSize = "sm" | "md";
const chipSizeClass = (size: ChipSize) =>
  size === "md"
    ? "text-xs px-2 py-1.5 rounded-md"
    : "text-[11px] px-1.5 py-1 rounded";
const chipIconSize = (size: ChipSize) => (size === "md" ? 14 : 12);

/** One chip per project for a day (default view), with a task count badge. */
export function ProjectChip({
  rollup,
  categoryById,
  onOpenProject,
  size = "sm",
}: {
  rollup: ProjectRollup;
  categoryById: Map<string, Category>;
  onOpenProject: (p: Project) => void;
  size?: ChipSize;
}) {
  const { project, tasks } = rollup;
  return (
    <button
      type="button"
      onClick={() => project && onOpenProject(project)}
      disabled={!project}
      title={project?.name}
      className={`w-full text-left leading-tight border flex items-center gap-1.5 ${chipSizeClass(
        size
      )} ${projectChipClass(project, categoryById)} ${
        project ? "hover:opacity-80" : ""
      }`}
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
  size = "sm",
}: {
  task: Task;
  onEditTask: (t: Task) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  size?: ChipSize;
}) {
  return (
    <div
      className={`w-full leading-tight border bg-surface border-border text-text flex items-center gap-1.5 group ${chipSizeClass(
        size
      )}`}
    >
      <button
        type="button"
        onClick={() => onToggleTask(task)}
        aria-label={task.title}
        className="shrink-0 text-text-muted hover:text-accent"
      >
        <Check size={chipIconSize(size)} />
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
  size = "sm",
}: {
  item: RoutineItem;
  onCompleteOccurrence: (
    routineId: string,
    scheduledDate: string
  ) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
  size?: ChipSize;
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
      className={`w-full leading-tight border flex items-center gap-1.5 ${chipSizeClass(
        size
      )} ${ROUTINE_CHIP} ${item.completed ? "opacity-55" : ""}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={item.routine.title}
        className="shrink-0 hover:opacity-80"
      >
        {item.completed ? (
          <Check size={chipIconSize(size)} />
        ) : (
          <Repeat size={chipIconSize(size)} />
        )}
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

/**
 * Compact iOS-style event block for the Month grid: a colored bar with the
 * title (and optional time on a second line). No inline controls — tapping
 * drills into the Day view, which keeps narrow month cells legible.
 */
export function EventBlock({
  label,
  time,
  colorClass,
  count,
  strike,
  onClick,
}: {
  label: string;
  time?: string | null;
  colorClass: string;
  count?: number;
  strike?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`w-full text-left rounded-sm border px-1 py-0.5 overflow-hidden hover:opacity-80 ${colorClass}`}
    >
      <span className="flex items-center gap-1">
        <span
          className={`text-[10px] leading-tight truncate flex-1 ${
            strike ? "line-through opacity-60" : ""
          }`}
        >
          {label}
        </span>
        {count != null && (
          <span className="shrink-0 text-[9px] tabular-nums opacity-75">
            {count}
          </span>
        )}
      </span>
      {time && (
        <span className="block text-[9px] leading-tight opacity-70 truncate">
          {time}
        </span>
      )}
    </button>
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
