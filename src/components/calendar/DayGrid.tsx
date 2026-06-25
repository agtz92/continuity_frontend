"use client";

import { Repeat } from "lucide-react";
import type { Category, Project, Task } from "@/lib/types";
import {
  blockMinutes,
  hoursRange,
  rollupByProject,
  timeToMinutes,
  type DayLoad,
  type RoutineItem,
} from "@/lib/calendar";
import {
  LoadBar,
  ProjectChip,
  ROUTINE_CHIP,
  RoutineChip,
  TaskChip,
  projectChipClass,
  type CalendarHandlers,
} from "./parts";

const HOUR_PX = 44;
const MIN_BLOCK_PX = 22;

export function DayGrid({
  iso,
  todayISO,
  locale,
  dayTasks,
  dayRoutines,
  load,
  projectsById,
  categoryById,
  showTasks,
  showLoad,
  handlers,
  allDayLabel,
  nowLabel,
}: {
  iso: string;
  todayISO: string;
  locale: string;
  dayTasks: Task[];
  dayRoutines: RoutineItem[];
  load: DayLoad;
  projectsById: Map<string, Project>;
  categoryById: Map<string, Category>;
  showTasks: boolean;
  showLoad: boolean;
  handlers: CalendarHandlers;
  allDayLabel: string;
  nowLabel: string;
}) {
  const timedTasks = dayTasks.filter((t) => t.dueTime);
  const untimedTasks = dayTasks.filter((t) => !t.dueTime);
  const timedRoutines = dayRoutines.filter((r) => r.routine.timeOfDay);
  const untimedRoutines = dayRoutines.filter((r) => !r.routine.timeOfDay);

  const starts = [
    ...timedTasks.map((t) => timeToMinutes(t.dueTime) ?? 0),
    ...timedRoutines.map((r) => timeToMinutes(r.routine.timeOfDay) ?? 0),
  ];
  const [startHour, endHour] = hoursRange(starts);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridHeight = (endHour - startHour) * HOUR_PX;

  const topFor = (minutes: number) => (minutes / 60 - startHour) * HOUR_PX;

  const untimedRollups = rollupByProject(untimedTasks, projectsById);

  const isToday = iso === todayISO;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNow =
    isToday && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

  return (
    <div className="flex flex-col gap-3">
      {showLoad && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">≈ {load.hours}h</span>
          <div className="w-40">
            <LoadBar load={load} />
          </div>
        </div>
      )}

      {/* All-day row */}
      <div className="flex border border-border rounded-lg bg-surface overflow-hidden">
        <div className="w-14 shrink-0 text-[10px] text-text-muted px-2 py-2 border-r border-border flex items-center">
          {allDayLabel}
        </div>
        <div className="flex-1 p-1.5 flex flex-wrap gap-1 min-h-[36px]">
          {untimedRollups.map((r, i) => {
            if (showTasks || !r.project) {
              return r.tasks.map((t) => (
                <div key={t.id} className="max-w-[220px]">
                  <TaskChip
                    task={t}
                    onEditTask={handlers.onEditTask}
                    onToggleTask={handlers.onToggleTask}
                  />
                </div>
              ));
            }
            return (
              <div key={r.project.id ?? `none-${i}`} className="max-w-[220px]">
                <ProjectChip
                  rollup={r}
                  categoryById={categoryById}
                  onOpenProject={handlers.onOpenProject}
                />
              </div>
            );
          })}
          {untimedRoutines.map((item) => (
            <div
              key={`${item.routine.id}-${item.scheduledDate}`}
              className="max-w-[220px]"
            >
              <RoutineChip
                item={item}
                onCompleteOccurrence={handlers.onCompleteOccurrence}
                onUncompleteOccurrence={handlers.onUncompleteOccurrence}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hourly grid */}
      <div className="relative border border-border rounded-lg bg-surface overflow-hidden">
        <div>
          {hours.map((h) => (
            <div key={h} className="flex" style={{ height: HOUR_PX }}>
              <div className="w-14 shrink-0 text-[10px] text-text-muted px-2 pt-1 border-r border-t border-border">
                {new Date(2000, 0, 1, h).toLocaleTimeString(locale, {
                  hour: "numeric",
                })}
              </div>
              <div className="flex-1 border-t border-border" />
            </div>
          ))}
        </div>

        <div
          className="absolute top-0 left-14 right-0"
          style={{ height: gridHeight }}
        >
          {timedTasks.map((t) => {
            const start = timeToMinutes(t.dueTime) ?? 0;
            const project = t.projectId
              ? projectsById.get(t.projectId) ?? null
              : null;
            const h = Math.max(
              MIN_BLOCK_PX,
              (blockMinutes(t.durationMinutes, t.effortHours) / 60) * HOUR_PX
            );
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => handlers.onEditTask(t)}
                style={{ top: topFor(start), height: h }}
                className={`absolute left-1.5 right-2 rounded border px-1.5 py-0.5 text-left overflow-hidden hover:opacity-80 ${projectChipClass(
                  project,
                  categoryById
                )}`}
              >
                <div className="text-[11px] font-medium leading-tight truncate">
                  {t.title}
                </div>
                {project && (
                  <div className="text-[10px] opacity-70 truncate">
                    {project.name}
                  </div>
                )}
              </button>
            );
          })}
          {timedRoutines.map((item) => {
            const start = timeToMinutes(item.routine.timeOfDay) ?? 0;
            const h = Math.max(
              MIN_BLOCK_PX,
              (blockMinutes(
                item.routine.durationMinutes,
                item.routine.effortHours
              ) /
                60) *
                HOUR_PX
            );
            return (
              <div
                key={`${item.routine.id}-${item.scheduledDate}`}
                style={{ top: topFor(start), height: h }}
                className={`absolute left-1.5 right-2 rounded border px-1.5 py-0.5 overflow-hidden flex items-start gap-1 ${ROUTINE_CHIP} ${
                  item.completed ? "opacity-55" : ""
                }`}
              >
                <Repeat size={11} className="mt-0.5 shrink-0" />
                <span
                  className={`text-[11px] leading-tight truncate ${
                    item.completed ? "line-through" : ""
                  }`}
                >
                  {item.routine.title}
                </span>
              </div>
            );
          })}

          {showNow && (
            <div
              className="absolute left-0 right-0 border-t-2 border-accent"
              style={{ top: topFor(nowMinutes) }}
            >
              <span className="absolute -top-2 left-1 w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="absolute -top-3.5 left-4 text-[10px] text-accent bg-surface px-1">
                {nowLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
