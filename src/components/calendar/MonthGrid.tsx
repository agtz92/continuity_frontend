"use client";

import type { ReactNode } from "react";
import type { Category, Project, Task } from "@/lib/types";
import {
  dayLoad,
  isSameMonth,
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

const MAX_CHIPS = 3;

export function MonthGrid({
  weeks,
  refDate,
  todayISO,
  locale,
  weekdayLabels,
  tasksByDay,
  routinesByDay,
  projectsById,
  categoryById,
  showTasks,
  showLoad,
  handlers,
  onPickDay,
  moreLabel,
}: {
  weeks: string[][];
  refDate: Date;
  todayISO: string;
  locale: string;
  weekdayLabels: string[];
  tasksByDay: Map<string, Task[]>;
  routinesByDay: Map<string, RoutineItem[]>;
  projectsById: Map<string, Project>;
  categoryById: Map<string, Category>;
  showTasks: boolean;
  showLoad: boolean;
  handlers: CalendarHandlers;
  onPickDay: (iso: string) => void;
  moreLabel: (n: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((w, i) => (
          <div
            key={i}
            className="text-center text-[10px] uppercase text-text-muted"
          >
            {w}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0]} className="grid grid-cols-7 gap-1">
          {week.map((iso) => {
            const dayTasks = tasksByDay.get(iso) ?? [];
            const dayRoutines = routinesByDay.get(iso) ?? [];
            const rollups = rollupByProject(dayTasks, projectsById);
            const load = dayLoad(dayTasks, dayRoutines);
            const inMonth = isSameMonth(iso, refDate);
            const isToday = iso === todayISO;
            const d = new Date(iso + "T00:00:00");

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
            const visible = chips.slice(0, MAX_CHIPS);
            const hidden = chips.length - visible.length;

            return (
              <div
                key={iso}
                className={`min-h-[96px] rounded-lg border p-1 flex flex-col gap-1 bg-surface ${
                  isToday ? "border-accent" : "border-border"
                } ${inMonth ? "" : "opacity-45"}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => onPickDay(iso)}
                    className={`text-xs font-medium tabular-nums hover:opacity-70 ${
                      isToday
                        ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-bg"
                        : "text-text"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                  {showLoad && load.hours > 0 && (
                    <div className="w-8">
                      <LoadBar load={load} />
                    </div>
                  )}
                </div>
                {visible}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => onPickDay(iso)}
                    className="text-[10px] text-text-muted text-left hover:text-text px-1"
                  >
                    {moreLabel(hidden)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
