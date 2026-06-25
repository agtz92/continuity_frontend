"use client";

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
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((iso) => {
        const dayTasks = tasksByDay.get(iso) ?? [];
        const dayRoutines = routinesByDay.get(iso) ?? [];
        const rollups = rollupByProject(dayTasks, projectsById);
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
              {rollups.map((r, i) => {
                const key = r.project?.id ?? `none-${i}`;
                if (showTasks || !r.project) {
                  return r.tasks.map((t) => (
                    <TaskChip
                      key={t.id}
                      task={t}
                      onEditTask={handlers.onEditTask}
                      onToggleTask={handlers.onToggleTask}
                    />
                  ));
                }
                return (
                  <ProjectChip
                    key={key}
                    rollup={r}
                    categoryById={categoryById}
                    onOpenProject={handlers.onOpenProject}
                  />
                );
              })}
              {dayRoutines.map((item) => (
                <RoutineChip
                  key={`${item.routine.id}-${item.scheduledDate}`}
                  item={item}
                  onCompleteOccurrence={handlers.onCompleteOccurrence}
                  onUncompleteOccurrence={handlers.onUncompleteOccurrence}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
