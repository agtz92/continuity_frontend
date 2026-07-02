"use client";

import type { ReactNode } from "react";
import type { Category, Project, Task } from "@/lib/types";
import {
  dayLoad,
  formatTime,
  isSameMonth,
  rollupByProject,
  type RoutineItem,
} from "@/lib/calendar";
import {
  EventBlock,
  LoadBar,
  ROUTINE_CHIP,
  projectChipClass,
  type CalendarHandlers,
} from "./parts";

const MAX_CHIPS = 3;

export function MonthGrid({
  weeks,
  refDate,
  todayISO,
  selectedISO,
  locale,
  weekdayLabels,
  tasksByDay,
  routinesByDay,
  projectsById,
  categoryById,
  showTasks,
  showLoad,
  onPickDay,
  moreLabel,
}: {
  weeks: string[][];
  refDate: Date;
  todayISO: string;
  selectedISO: string;
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
            const isSelected = iso === selectedISO;
            const d = new Date(iso + "T00:00:00");

            const chips: ReactNode[] = [];
            for (let i = 0; i < rollups.length; i++) {
              const r = rollups[i];
              if (showTasks || !r.project) {
                for (const t of r.tasks) {
                  const project = t.projectId
                    ? projectsById.get(t.projectId) ?? null
                    : null;
                  chips.push(
                    <EventBlock
                      key={t.id}
                      label={t.title}
                      time={formatTime(t.dueTime, locale)}
                      colorClass={projectChipClass(project, categoryById)}
                      onClick={() => onPickDay(iso)}
                    />
                  );
                }
              } else {
                chips.push(
                  <EventBlock
                    key={r.project.id}
                    label={r.project.name}
                    count={r.tasks.length}
                    colorClass={projectChipClass(r.project, categoryById)}
                    onClick={() => onPickDay(iso)}
                  />
                );
              }
            }
            for (const item of dayRoutines) {
              chips.push(
                <EventBlock
                  key={`${item.routine.id}-${item.scheduledDate}`}
                  label={item.routine.title}
                  time={formatTime(item.routine.timeOfDay, locale)}
                  colorClass={ROUTINE_CHIP}
                  strike={item.completed}
                  onClick={() => onPickDay(iso)}
                />
              );
            }
            const visible = chips.slice(0, MAX_CHIPS);
            const hidden = chips.length - visible.length;

            return (
              <div
                key={iso}
                className={`min-h-[104px] md:min-h-[112px] rounded-lg border p-1 flex flex-col gap-0.5 ${
                  isSelected
                    ? "border-accent ring-1 ring-accent bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                    : isToday
                      ? "border-accent bg-surface"
                      : "border-border bg-surface"
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
