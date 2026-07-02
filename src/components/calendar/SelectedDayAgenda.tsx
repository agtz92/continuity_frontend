"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { Category, Project, Task } from "@/lib/types";
import {
  dayLoad,
  formatTime,
  rollupByProject,
  timeToMinutes,
  type RoutineItem,
} from "@/lib/calendar";
import {
  ProjectChip,
  RoutineChip,
  TaskChip,
  type CalendarHandlers,
} from "./parts";

/**
 * Agenda panel for the day selected in the Month grid: readable rows for the
 * day's items (all-day first, then timed ones sorted by hour) plus an
 * "Open day" shortcut into the full Day view. Keeps the month context while
 * still exposing the detail of a single day.
 */
export function SelectedDayAgenda({
  iso,
  locale,
  dayTasks,
  dayRoutines,
  projectsById,
  categoryById,
  showTasks,
  handlers,
  openDayLabel,
  activitiesLabel,
  emptyLabel,
  onOpenDay,
}: {
  iso: string;
  locale: string;
  dayTasks: Task[];
  dayRoutines: RoutineItem[];
  projectsById: Map<string, Project>;
  categoryById: Map<string, Category>;
  showTasks: boolean;
  handlers: CalendarHandlers;
  openDayLabel: string;
  activitiesLabel: (count: number) => string;
  emptyLabel: string;
  onOpenDay: (iso: string) => void;
}) {
  const untimedTasks = dayTasks.filter((t) => !t.dueTime);
  const timed: { key: string; minutes: number; time: string; node: ReactNode }[] =
    [];

  dayTasks
    .filter((t) => t.dueTime)
    .forEach((t) => {
      timed.push({
        key: t.id,
        minutes: timeToMinutes(t.dueTime) ?? 0,
        time: formatTime(t.dueTime, locale) ?? "",
        node: (
          <TaskChip
            task={t}
            onEditTask={handlers.onEditTask}
            onToggleTask={handlers.onToggleTask}
            size="md"
          />
        ),
      });
    });
  dayRoutines
    .filter((r) => r.routine.timeOfDay)
    .forEach((item) => {
      timed.push({
        key: `${item.routine.id}-${item.scheduledDate}`,
        minutes: timeToMinutes(item.routine.timeOfDay) ?? 0,
        time: formatTime(item.routine.timeOfDay, locale) ?? "",
        node: (
          <RoutineChip
            item={item}
            onCompleteOccurrence={handlers.onCompleteOccurrence}
            onUncompleteOccurrence={handlers.onUncompleteOccurrence}
            size="md"
          />
        ),
      });
    });
  timed.sort((a, b) => a.minutes - b.minutes);

  const untimedRoutines = dayRoutines.filter((r) => !r.routine.timeOfDay);
  const untimedRollups = rollupByProject(untimedTasks, projectsById);

  const allDay: { key: string; node: ReactNode }[] = [];
  untimedRollups.forEach((r, i) => {
    if (showTasks || !r.project) {
      r.tasks.forEach((t) => {
        allDay.push({
          key: t.id,
          node: (
            <TaskChip
              task={t}
              onEditTask={handlers.onEditTask}
              onToggleTask={handlers.onToggleTask}
              size="md"
            />
          ),
        });
      });
    } else {
      allDay.push({
        key: r.project.id ?? `none-${i}`,
        node: (
          <ProjectChip
            rollup={r}
            categoryById={categoryById}
            onOpenProject={handlers.onOpenProject}
            size="md"
          />
        ),
      });
    }
  });
  untimedRoutines.forEach((item) => {
    allDay.push({
      key: `${item.routine.id}-${item.scheduledDate}`,
      node: (
        <RoutineChip
          item={item}
          onCompleteOccurrence={handlers.onCompleteOccurrence}
          onUncompleteOccurrence={handlers.onUncompleteOccurrence}
          size="md"
        />
      ),
    });
  });

  const count = allDay.length + timed.length;
  const load = dayLoad(dayTasks, dayRoutines);
  const d = new Date(iso + "T00:00:00");
  const dateLabel = d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
  });

  return (
    <div className="mt-3 border border-border rounded-lg bg-surface">
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5">
        <span className="text-xs font-medium text-text capitalize truncate">
          {dateLabel} · {activitiesLabel(count)}
          {load.hours > 0 ? ` · ≈ ${load.hours}h` : ""}
        </span>
        <button
          type="button"
          onClick={() => onOpenDay(iso)}
          className="shrink-0 inline-flex items-center gap-1 text-xs text-accent hover:opacity-80"
        >
          {openDayLabel}
          <ArrowRight size={13} />
        </button>
      </div>

      {count === 0 ? (
        <div className="px-3 pb-3 pt-1 text-xs text-text-muted italic">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-1 px-2.5 pb-2.5 pt-1">
          {allDay.map((it) => (
            <div key={it.key}>{it.node}</div>
          ))}
          {timed.map((it) => (
            <div key={it.key} className="flex items-center gap-2">
              <span className="w-11 shrink-0 text-[10px] text-text-muted tabular-nums">
                {it.time}
              </span>
              <div className="flex-1 min-w-0">{it.node}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
