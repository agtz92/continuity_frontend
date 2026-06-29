"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Gauge, ListChecks } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Category, Project, Routine, RoutineOccurrence, Task } from "@/lib/types";
import { todayLocalISODate, toLocalISO } from "@/lib/date";
import { isDailyViewStatus } from "@/lib/projectStatus";
import {
  addDaysISO,
  dayLoad,
  monthMatrix,
  routineItemsByDay,
  tasksByDay,
  weekDays,
  type CalendarView as CalendarViewMode,
} from "@/lib/calendar";
import type { CalendarHandlers } from "../calendar/parts";
import { WeekGrid } from "../calendar/WeekGrid";
import { MonthGrid } from "../calendar/MonthGrid";
import { DayGrid } from "../calendar/DayGrid";

const VIEW_KEY = "cont.calendar.view";
const TASKS_KEY = "cont.calendar.showTasks";
const LOAD_KEY = "cont.calendar.showLoad";

export function CalendarView({
  projects,
  tasks,
  routines,
  occurrences,
  categories,
  onOpenProject,
  onEditTask,
  onToggleTask,
  onCompleteOccurrence,
  onUncompleteOccurrence,
}: {
  projects: Project[];
  tasks: Task[];
  routines: Routine[];
  occurrences: RoutineOccurrence[];
  categories: Category[];
  onOpenProject: (p: Project) => void;
  onEditTask: (t: Task) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onCompleteOccurrence: (
    routineId: string,
    scheduledDate: string
  ) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.calendar");
  const locale = useLocale();
  const todayISO = todayLocalISODate();

  const [view, setView] = useState<CalendarViewMode>("week");
  const [refISO, setRefISO] = useState<string>(todayISO);
  const [showTasks, setShowTasks] = useState(false);
  const [showLoad, setShowLoad] = useState(true);

  // Restore persisted preferences after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "day" || v === "week" || v === "month") setView(v);
      const st = localStorage.getItem(TASKS_KEY);
      if (st != null) setShowTasks(st === "1");
      const sl = localStorage.getItem(LOAD_KEY);
      if (sl != null) setShowLoad(sl === "1");
    } catch {
      /* localStorage unavailable */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_KEY, showTasks ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [showTasks]);
  useEffect(() => {
    try {
      localStorage.setItem(LOAD_KEY, showLoad ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [showLoad]);

  const refDate = useMemo(() => new Date(refISO + "T00:00:00"), [refISO]);

  const { fromISO, toISO, days, weeks } = useMemo(() => {
    if (view === "day") {
      return { fromISO: refISO, toISO: refISO, days: [refISO], weeks: [] as string[][] };
    }
    if (view === "week") {
      const d = weekDays(refDate);
      return { fromISO: d[0], toISO: d[6], days: d, weeks: [] as string[][] };
    }
    const w = monthMatrix(refDate);
    return { fromISO: w[0][0], toISO: w[w.length - 1][6], days: [] as string[], weeks: w };
  }, [view, refISO, refDate]);

  const projectStatusById = useMemo(
    () => new Map(projects.map((p) => [p.id, p.status])),
    [projects]
  );
  // Mirror Today/Tasks: tasks of a closed project (paused/stalled/killed/
  // archived) are withdrawn from the calendar; standalone tasks and tasks of a
  // live project stay. Keeps the calendar in sync with the other task views.
  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.projectId) return true;
        const status = projectStatusById.get(task.projectId);
        return status ? isDailyViewStatus(status) : true;
      }),
    [tasks, projectStatusById]
  );

  const tByDay = useMemo(
    () => tasksByDay(visibleTasks, fromISO, toISO),
    [visibleTasks, fromISO, toISO]
  );
  const rByDay = useMemo(
    () => routineItemsByDay(routines, occurrences, fromISO, toISO),
    [routines, occurrences, fromISO, toISO]
  );
  const projectsById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const handlers: CalendarHandlers = {
    onOpenProject,
    onEditTask,
    onToggleTask,
    onCompleteOccurrence,
    onUncompleteOccurrence,
  };

  const shift = (dir: number) => {
    if (view === "day") setRefISO(addDaysISO(refISO, dir));
    else if (view === "week") setRefISO(addDaysISO(refISO, dir * 7));
    else {
      const d = new Date(refDate);
      d.setMonth(d.getMonth() + dir);
      setRefISO(toLocalISO(d));
    }
  };

  const periodLabel = useMemo(() => {
    if (view === "day") {
      return refDate.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
    if (view === "week") {
      const a = new Date(days[0] + "T00:00:00");
      const b = new Date(days[6] + "T00:00:00");
      const fmt = (d: Date) =>
        d.toLocaleDateString(locale, { day: "numeric", month: "short" });
      return `${fmt(a)} – ${fmt(b)}`;
    }
    return refDate.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [view, refDate, days, locale]);

  const hasAny = tByDay.size > 0 || rByDay.size > 0;

  const segBtn = (mode: CalendarViewMode, label: string) => (
    <button
      type="button"
      onClick={() => setView(mode)}
      className={`text-xs px-3 py-1.5 ${
        view === mode ? "bg-accent text-bg font-medium" : "text-text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );

  const toggleBtn = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs px-2.5 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${
        active
          ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-accent border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
          : "bg-surface text-text-muted border-border hover:text-text"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="inline-flex border border-border rounded-lg overflow-hidden">
            {segBtn("day", t("viewDay"))}
            {segBtn("week", t("viewWeek"))}
            {segBtn("month", t("viewMonth"))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {toggleBtn(
            showTasks,
            () => setShowTasks((v) => !v),
            <ListChecks size={13} />,
            t("showTasks")
          )}
          {toggleBtn(
            showLoad,
            () => setShowLoad((v) => !v),
            <Gauge size={13} />,
            t("load")
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label={t("prev")}
          className="p-1.5 rounded-md border border-border text-text-muted hover:text-text"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={t("next")}
          className="p-1.5 rounded-md border border-border text-text-muted hover:text-text"
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => setRefISO(todayISO)}
          className="text-xs px-3 py-1.5 rounded-md border border-border text-text-muted hover:text-text"
        >
          {t("today")}
        </button>
        <span className="text-sm font-medium text-text capitalize">
          {periodLabel}
        </span>
      </div>

      {/* Grid */}
      {!hasAny ? (
        <div className="text-sm text-text-muted italic py-10 text-center border border-border rounded-lg bg-surface">
          {t("empty")}
        </div>
      ) : view === "week" ? (
        <WeekGrid
          days={days}
          todayISO={todayISO}
          locale={locale}
          tasksByDay={tByDay}
          routinesByDay={rByDay}
          projectsById={projectsById}
          categoryById={categoryById}
          showTasks={showTasks}
          showLoad={showLoad}
          handlers={handlers}
        />
      ) : view === "month" ? (
        <MonthGrid
          weeks={weeks}
          refDate={refDate}
          todayISO={todayISO}
          locale={locale}
          weekdayLabels={(weeks[0] ?? []).map((iso) =>
            new Date(iso + "T00:00:00").toLocaleDateString(locale, {
              weekday: "short",
            })
          )}
          tasksByDay={tByDay}
          routinesByDay={rByDay}
          projectsById={projectsById}
          categoryById={categoryById}
          showTasks={showTasks}
          showLoad={showLoad}
          handlers={handlers}
          onPickDay={(iso) => {
            setRefISO(iso);
            setView("day");
          }}
          moreLabel={(n) => t("more", { count: n })}
        />
      ) : (
        <DayGrid
          iso={refISO}
          todayISO={todayISO}
          locale={locale}
          dayTasks={tByDay.get(refISO) ?? []}
          dayRoutines={rByDay.get(refISO) ?? []}
          load={dayLoad(tByDay.get(refISO) ?? [], rByDay.get(refISO) ?? [])}
          projectsById={projectsById}
          categoryById={categoryById}
          showTasks={showTasks}
          showLoad={showLoad}
          handlers={handlers}
          allDayLabel={t("allDay")}
          nowLabel={t("now")}
        />
      )}
    </div>
  );
}
