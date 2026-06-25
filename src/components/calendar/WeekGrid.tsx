"use client";

import type { ReactNode } from "react";
import type { Category, Project, Task } from "@/lib/types";
import {
  dayLoad,
  rollupByProject,
  type RoutineItem,
} from "@/lib/calendar";
import {
  LoadBar,
  ProjectChip,
  RoutineChip,
  TaskChip,
  type CalendarHandlers,
} from "./parts";

export function WeekGrid({
  days,
  todayISO,
  locale,
  tasksByDay,
  routinesByDay,
  projectsById,
  categoryById,
  showTasks,
  showLoad,
  handlers,
}: {
  days: string[];
  todayISO: string;
  locale: string;
  tasksByDay: Map<string, Task[]>;
  routinesByDay: Map<string, RoutineItem[]>;
  projectsById: Map<string, Project>;
  categoryById: Map<string, Category>;
  showTasks: boolean;
  showLoad: boolean;
  handlers: CalendarHandlers;
}) {
  // Per-day chips (project rollups or tasks, plus routines) shared by the
  // desktop grid and the mobile agenda so both stay in sync.
  const dayChips = (iso: string): ReactNode[] => {
    const dayTasks = tasksByDay.get(iso) ?? [];
    const dayRoutines = routinesByDay.get(iso) ?? [];
    const rollups = rollupByProject(dayTasks, projectsById);
    const chips: ReactNode[] = [];
    for (let i = 0; i < rollups.length; i++) {
      const r = rollups[i];
      if (showTasks || !r.project) {
        for (const t of r.tasks) {
          chips.push(
            <TaskChip
              key={t.id}
              task={t}
              onEditTask={handlers.onEditTask}
              onToggleTask={handlers.onToggleTask}
            />
          );
        }
      } else {
        chips.push(
          <ProjectChip
            key={r.project.id}
            rollup={r}
            categoryById={categoryById}
            onOpenProject={handlers.onOpenProject}
          />
        );
      }
    }
    for (const item of dayRoutines) {
      chips.push(
        <RoutineChip
          key={`${item.routine.id}-${item.scheduledDate}`}
          item={item}
          onCompleteOccurrence={handlers.onCompleteOccurrence}
          onUncompleteOccurrence={handlers.onUncompleteOccurrence}
        />
      );
    }
    return chips;
  };

  return (
    <>
      {/* Mobile: vertical agenda — full-width, legible rows per day (iOS-like). */}
      <div className="flex flex-col gap-1.5 md:hidden">
        {days.map((iso) => {
          const dayTasks = tasksByDay.get(iso) ?? [];
          const dayRoutines = routinesByDay.get(iso) ?? [];
          const load = dayLoad(dayTasks, dayRoutines);
          const isToday = iso === todayISO;
          const d = new Date(iso + "T00:00:00");
          const chips = dayChips(iso);
          return (
            <div
              key={iso}
              className={`flex gap-2 rounded-lg border p-2 ${
                isToday ? "border-accent" : "border-border"
              } bg-surface`}
            >
              <div className="w-10 shrink-0 text-center">
                <div className="text-[10px] uppercase text-text-muted">
                  {d.toLocaleDateString(locale, { weekday: "short" })}
                </div>
                <div
                  className={`text-base font-semibold tabular-nums ${
                    isToday
                      ? "inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-bg"
                      : "text-text"
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
              <div className="flex-1 min-w-0 border-l border-border pl-2 flex flex-col gap-1 justify-center">
                {chips.length > 0 ? (
                  <>
                    {chips}
                    {showLoad && load.hours > 0 && (
                      <div className="pt-0.5">
                        <LoadBar load={load} />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] text-text-muted italic">·</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: classic 7-column week grid. */}
      <div className="hidden md:grid grid-cols-7 gap-1">
        {days.map((iso) => {
          const dayTasks = tasksByDay.get(iso) ?? [];
          const dayRoutines = routinesByDay.get(iso) ?? [];
          const load = dayLoad(dayTasks, dayRoutines);
          const isToday = iso === todayISO;
          const d = new Date(iso + "T00:00:00");
          return (
            <div key={iso} className="flex flex-col min-w-0">
              <div className="text-center pb-1">
                <div className="text-[10px] uppercase text-text-muted">
                  {d.toLocaleDateString(locale, { weekday: "short" })}
                </div>
                <div
                  className={`text-sm font-medium tabular-nums ${
                    isToday
                      ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-bg"
                      : "text-text"
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
              {showLoad && (
                <div className="px-0.5 pb-1.5">
                  <LoadBar load={load} />
                </div>
              )}
              <div
                className={`flex-1 min-h-[120px] rounded-lg border p-1 flex flex-col gap-1 ${
                  isToday ? "border-accent" : "border-border"
                } bg-surface`}
              >
                {dayChips(iso)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
