"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  Flag,
  Lightbulb,
  Moon,
  Plus,
  Repeat,
  Rocket,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Undo2,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  Activity,
  Category,
  Project,
  ProjectNote,
  Routine,
  RoutineOccurrence,
  Task,
} from "@/lib/types";
import { daysOverdue, daysSince, todayLocalISODate, toLocalISO } from "@/lib/date";
import { completedDatesFor, computeDueDates } from "@/lib/recurrence";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { FAB } from "../ui/FAB";
import { ProjectCardCompact } from "../projects/ProjectCardCompact";
import { RoutineRow } from "../routines/RoutineRow";
import { useTodayFocus } from "@/hooks/useTodayFocus";
import type { useProductivityStats } from "@/hooks/useProductivityStats";
import { useTodayLayout } from "@/hooks/useTodayLayout";
import { TODAY_SECTIONS, type TodaySectionId } from "@/lib/todaySections";
import { TodaySection } from "../today/TodaySection";
import { TodayCustomizeBar } from "../today/TodayCustomizeBar";
import { HiddenSectionsFooter } from "../today/HiddenSectionsFooter";
import { TodayActionSheet } from "./TodayActionSheet";

type ProductivityStats = ReturnType<typeof useProductivityStats>;

function greetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 19) return "afternoon";
  return "evening";
}

const sleepingBucketStyle = {
  "7-14": {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  "15-30": {
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
  },
  "30+": {
    chip: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
} as const;

// Icon shown next to each section name inside the customize-mode card.
const SECTION_ICON: Record<TodaySectionId, ReactNode> = {
  counters: <TrendingUp size={18} className="text-accent-2" />,
  "stalled-alert": <Bell size={18} className="text-amber-400" />,
  "today-focus": <Target size={18} className="text-accent" />,
  "routines-today": <Repeat size={18} className="text-accent-2" />,
  "done-today": <Sparkles size={18} className="text-accent" />,
  closeable: <Flag size={18} className="text-accent" />,
  sleeping: <Moon size={18} className="text-amber-400" />,
  "stale-ideas": <Lightbulb size={18} className="text-purple-400" />,
  "active-projects": <Zap size={18} className="text-accent" />,
  "launched-with-tasks": <Rocket size={18} className="text-accent-2" />,
};

// Sections whose normal rendering only happens on mobile. We badge them
// in the customize-mode list so the user understands the hide toggle is
// effectively a mobile-only setting today.
const MOBILE_ONLY_SECTIONS: ReadonlySet<TodaySectionId> = new Set([
  "counters",
]);

export function TodayView({
  projects,
  tasks,
  ideasCount,
  activities,
  projectNotes,
  routines,
  routineOccurrences,
  categoryById,
  lastBackup,
  daysSinceBackup,
  backupOverdue,
  hasData,
  productivityStats,
  onOpenBackupModal,
  onJumpToProject,
  onJumpToTasks,
  onJumpToIdeas,
  onJumpToRoutines,
  onNewTask,
  onNewProject,
  onNewIdea,
  onNewRoutine,
  onLogUpdate,
  onToggleTask,
  onEditTask,
  onEditRoutine,
  onCompleteOccurrence,
  onUncompleteOccurrence,
  onRefresh,
}: {
  projects: Project[];
  tasks: Task[];
  ideasCount: number;
  activities: Activity[];
  projectNotes: ProjectNote[];
  routines: Routine[];
  routineOccurrences: RoutineOccurrence[];
  categoryById: Record<string, Category>;
  lastBackup: string | null;
  daysSinceBackup: number | null;
  backupOverdue: boolean;
  hasData: boolean;
  productivityStats: ProductivityStats;
  onOpenBackupModal: () => void;
  onJumpToProject: (p: Project) => void;
  onJumpToTasks: () => void;
  onJumpToIdeas: () => void;
  onJumpToRoutines: () => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onNewIdea: () => void;
  onNewRoutine: () => void;
  onLogUpdate: (p: Project) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onEditRoutine: (r: Routine) => void;
  onCompleteOccurrence: (
    routineId: string,
    scheduledDate: string
  ) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
  /**
   * Refetch the dashboard data. Called when the user finishes customizing
   * the Today layout so any new sections that became visible reflect the
   * latest server state, and as a safety net in case mutations elsewhere
   * (e.g. opening this view after creating something) left cache stale.
   */
  onRefresh?: () => void | Promise<unknown>;
}) {
  const t = useTranslations("views.today");
  const tFocus = useTranslations("views.today.focus");
  const tDone = useTranslations("views.today.doneToday");
  const tCloseable = useTranslations("views.today.closeable");
  const tSleep = useTranslations("views.today.sleeping");
  const tStale = useTranslations("views.today.staleIdeas");
  const tTabs = useTranslations("tabs");
  const tGreeting = useTranslations("views.today.greeting");
  const tCounters = useTranslations("views.today.counters");
  const tFab = useTranslations("views.today.fab");
  const tCustom = useTranslations("views.today.customize");
  const tSections = useTranslations("views.today.sections");
  const locale = useLocale();

  const {
    stalled,
    todayFocus,
    todayTaskCounts,
    todayEffortHours,
    doneTodayItems,
    doneTodayEffortHours,
    launchedWithOpenTasks,
  } = useTodayFocus({
    projects,
    tasks,
    activities,
    projectNotes,
    routines,
    routineOccurrences,
  });

  const {
    sleepingProjects,
    closableProjects,
    staleIdeas,
    todayHoursByProject,
    projectProgressById,
    comebackProjectIds,
    comebackGapByProject,
  } = productivityStats;

  const [showFabSheet, setShowFabSheet] = useState(false);
  const [showTodayFocus, setShowTodayFocus] = useState(true);
  const [showDoneToday, setShowDoneToday] = useState(false);
  const [showActiveProjects, setShowActiveProjects] = useState(false);
  const [showLaunchedWithTasks, setShowLaunchedWithTasks] = useState(false);
  const [showSleepingProjects, setShowSleepingProjects] = useState(false);
  const [showCloseable, setShowCloseable] = useState(false);
  const [showRoutinesToday, setShowRoutinesToday] = useState(true);
  const [doneTodayFilter, setDoneTodayFilter] = useState<"all" | "task" | "log">("all");

  const layout = useTodayLayout();

  // Hand-off from onboarding step 5: `/dashboard?customize=1` opens the Today
  // layout editor straight away, then strips the param so a refresh doesn't
  // re-trigger it. Runs once.
  const router = useRouter();
  const searchParams = useSearchParams();
  const customizeHandledRef = useRef(false);
  useEffect(() => {
    if (customizeHandledRef.current) return;
    if (searchParams?.get("customize") === "1") {
      customizeHandledRef.current = true;
      layout.setEditMode(true);
      router.replace("/dashboard");
    }
  }, [searchParams, router, layout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = layout.order.indexOf(active.id as TodaySectionId);
    const toIdx = layout.order.indexOf(over.id as TodaySectionId);
    if (fromIdx === -1 || toIdx === -1) return;
    layout.reorder(fromIdx, toIdx);
  };

  const resolveRoutineProject = (r: Routine) => {
    if (!r.projectId) return undefined;
    const proj = projects.find((p) => p.id === r.projectId);
    if (!proj) return undefined;
    const cat = proj.categoryId ? categoryById[proj.categoryId] : undefined;
    return { name: proj.name, color: cat?.color ?? "emerald" };
  };

  const todayRoutineItems = useMemo(() => {
    const today = todayLocalISODate();
    const lookback = new Date();
    lookback.setDate(lookback.getDate() - 14);
    const backStart = toLocalISO(lookback);
    const items: { routine: Routine; scheduledDate: string }[] = [];
    for (const r of routines) {
      if (r.archived) continue;
      const done = completedDatesFor(routineOccurrences, r.id);
      const dates = computeDueDates(r, backStart, today);
      for (const d of dates) {
        if (!done.has(d)) items.push({ routine: r, scheduledDate: d });
      }
    }
    items.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    return items;
  }, [routines, routineOccurrences]);

  const todayRoutineCounts = useMemo(() => {
    const today = todayLocalISODate();
    const overdue = todayRoutineItems.filter(
      (it) => it.scheduledDate < today
    ).length;
    const dueToday = todayRoutineItems.filter(
      (it) => it.scheduledDate === today
    ).length;
    return { overdue, dueToday, total: overdue + dueToday };
  }, [todayRoutineItems]);

  const todayRoutineEffortHours = useMemo(() => {
    const sum = todayRoutineItems.reduce(
      (acc, it) => acc + (it.routine.effortHours ?? 0),
      0
    );
    return Math.round(sum * 10) / 10;
  }, [todayRoutineItems]);

  const closableTotal =
    closableProjects.quickWins.length + closableProjects.almostThere.length;

  const activeProjectsCount = useMemo(
    () => projects.filter((p) => p.status === "active").length,
    [projects]
  );
  const launchedProjectsCount = useMemo(
    () => projects.filter((p) => p.status === "launched").length,
    [projects]
  );

  const counters: { id: string; label: string; value: number; tint: string }[] = [
    {
      id: "active",
      label: tCounters("active"),
      value: activeProjectsCount,
      tint: "text-accent",
    },
    {
      id: "launched",
      label: tCounters("launched"),
      value: launchedProjectsCount,
      tint: "text-accent-2",
    },
    {
      id: "stalled",
      label: tCounters("stalled"),
      value: stalled.length,
      tint: "text-amber-400",
    },
    {
      id: "ideas",
      label: tCounters("ideas"),
      value: ideasCount,
      tint: "text-purple-400",
    },
    {
      id: "tasks",
      label: tCounters("tasks"),
      value: tasks.length,
      tint: "text-text",
    },
  ];

  const formattedDate = new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ---------- Section nodes (preserved JSX, one entry per section id) ---------- //
  // A section without data simply has no entry — undefined means "skip render".

  const sectionNodes: Partial<Record<TodaySectionId, ReactNode>> = {};

  if (hasData) {
    sectionNodes.counters = (
      <div
        className="md:hidden flex gap-2 overflow-x-auto snap-x snap-mandatory -mx-3 px-3 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {counters.map((c) => (
          <div
            key={c.id}
            className="snap-start shrink-0 min-w-[120px] bg-surface border border-border rounded-xl px-4 py-3"
          >
            <div className="text-[11px] uppercase tracking-wider text-text-muted">
              {c.label}
            </div>
            <div className={`text-2xl font-bold mt-0.5 ${c.tint}`}>{c.value}</div>
          </div>
        ))}
      </div>
    );
  }

  if (stalled.length > 0) {
    sectionNodes["stalled-alert"] = (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Bell className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
              {t("stalledAlert.title", { count: stalled.length })}
            </div>
            <div className="text-sm text-amber-700/80 dark:text-amber-200/80">
              {t("stalledAlert.subtitle")}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {stalled.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onJumpToProject(p)}
                  className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-md text-amber-700 dark:text-amber-200"
                >
                  {p.name} · {daysSince(p.lastActivity)}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  sectionNodes["today-focus"] = (
    <CollapsibleSection
      open={showTodayFocus}
      onToggle={() => setShowTodayFocus((s) => !s)}
      icon={<Target size={18} className="text-accent" />}
      title={tFocus("title")}
      rightSlot={
        todayTaskCounts.total > 0 ? (
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-700 dark:text-orange-200 shadow-sm shadow-orange-500/10"
              title={tFocus("tasksTooltip", {
                dueToday: todayTaskCounts.dueToday,
                overdue: todayTaskCounts.overdue,
              })}
            >
              <Target size={11} className="text-orange-700 dark:text-orange-300" />
              <span>{tFocus("tasksLabel", { count: todayTaskCounts.total })}</span>
              {todayTaskCounts.overdue > 0 && (
                <span className="text-red-700 dark:text-red-300 font-semibold">
                  {tFocus("overdueExtra", { count: todayTaskCounts.overdue })}
                </span>
              )}
            </span>
            {todayEffortHours > 0 && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-accent-2/15 text-accent-2 border-accent-2/40"
                title={tFocus("totalHoursTooltip")}
              >
                <Clock size={11} className="text-accent-2" />
                {tFocus("totalHoursLabel", { hours: todayEffortHours })}
              </span>
            )}
          </span>
        ) : null
      }
    >
      <>
        {todayFocus.items.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-muted mb-3">{tFocus("emptyTitle")}</p>
            <p className="text-sm text-text-muted">
              {projects.length === 0
                ? tFocus("emptyHintFirst")
                : tFocus("emptyHintNext")}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {todayFocus.items.map((item, idx) => (
              <div
                key={idx}
                className={`bg-surface p-4 rounded-xl border transition-all hover:border-border ${
                  item.type === "overdue"
                    ? "border-red-500/30"
                    : item.type === "today"
                    ? "border-orange-500/30"
                    : item.type === "stalled"
                    ? "border-amber-500/30"
                    : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.task && (
                    <button
                      onClick={() => onToggleTask(item.task!)}
                      className="shrink-0 text-text-muted hover:text-accent transition-colors"
                      title={tFocus("markDone")}
                      aria-label={tFocus("markDone")}
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  )}
                  <div
                    className={`flex-1 min-w-0 ${item.task ? "cursor-pointer" : ""}`}
                    onClick={item.task ? () => onEditTask(item.task!) : undefined}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs uppercase tracking-wider font-medium ${
                          item.type === "overdue"
                            ? "text-red-400"
                            : item.type === "today"
                            ? "text-orange-400"
                            : item.type === "stalled"
                            ? "text-amber-400"
                            : "text-accent"
                        }`}
                      >
                        {tFocus(
                          item.type === "today"
                            ? "labels.dueToday"
                            : item.type === "overdue"
                            ? "labels.overdue"
                            : item.type === "stalled"
                            ? "labels.stalled"
                            : "labels.nextStep"
                        )}
                      </span>
                      {item.type === "overdue" &&
                        item.task?.dueDate &&
                        (() => {
                          const n = daysOverdue(item.task.dueDate);
                          return n !== null ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/25 text-red-700 dark:text-red-200 border border-red-500/50">
                              {tFocus("daysLate", { count: n })}
                            </span>
                          ) : null;
                        })()}
                      {item.project && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToProject(item.project!);
                          }}
                          className="text-xs text-text-muted hover:text-accent hover:underline"
                        >
                          · {item.project.name}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-text">
                        {item.task
                          ? item.task.title
                          : item.type === "stalled" && item.project
                          ? tFocus("daysIdleLine", {
                              name: item.project.name,
                              count: daysSince(item.project.lastActivity) ?? 0,
                            })
                          : item.project?.nextStep}
                      </span>
                      {item.task?.effortHours != null && (
                        <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
                          <Clock size={10} />
                          {item.task.effortHours}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {todayFocus.total > todayFocus.items.length && (
          <button
            onClick={onJumpToTasks}
            className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-200 text-sm font-medium transition-colors"
          >
            {tFocus("viewAll")}
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/30 text-orange-800 dark:text-orange-100">
              {tFocus("moreCount", {
                count: todayFocus.total - todayFocus.items.length,
              })}
            </span>
            <ChevronRight size={14} />
          </button>
        )}
      </>
    </CollapsibleSection>
  );

  if (todayRoutineItems.length > 0) {
    sectionNodes["routines-today"] = (
      <CollapsibleSection
        open={showRoutinesToday}
        onToggle={() => setShowRoutinesToday((s) => !s)}
        icon={<Repeat size={18} className="text-accent-2" />}
        title={t("routines.title")}
        rightSlot={
          todayRoutineCounts.total > 0 ? (
            <span className="inline-flex items-center gap-2 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToRoutines();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-700 dark:text-orange-200 shadow-sm shadow-orange-500/10 hover:from-orange-500/30 hover:to-red-500/30"
                title={t("routines.routinesTooltip", {
                  dueToday: todayRoutineCounts.dueToday,
                  overdue: todayRoutineCounts.overdue,
                })}
              >
                <Repeat size={11} className="text-orange-700 dark:text-orange-300" />
                <span>
                  {t("routines.routinesLabel", { count: todayRoutineCounts.total })}
                </span>
                {todayRoutineCounts.overdue > 0 && (
                  <span className="text-red-700 dark:text-red-300 font-semibold">
                    {t("routines.overdueExtra", {
                      count: todayRoutineCounts.overdue,
                    })}
                  </span>
                )}
              </button>
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-accent-2/15 text-accent-2 border-accent-2/40"
                title={t("routines.totalHoursTooltip")}
              >
                <Clock size={11} className="text-accent-2" />
                {t("routines.totalHoursLabel", { hours: todayRoutineEffortHours })}
              </span>
            </span>
          ) : null
        }
      >
        <div className="grid md:grid-cols-2 gap-3">
          {todayRoutineItems.map((it) => (
            <RoutineRow
              key={`${it.routine.id}-${it.scheduledDate}`}
              routine={it.routine}
              scheduledDate={it.scheduledDate}
              occurrenceId={null}
              project={resolveRoutineProject(it.routine)}
              onComplete={onCompleteOccurrence}
              onUncomplete={onUncompleteOccurrence}
              onEdit={onEditRoutine}
            />
          ))}
        </div>
      </CollapsibleSection>
    );
  }

  if (doneTodayItems.length > 0) {
    const taskCount = doneTodayItems.filter((i) => i.kind === "task").length;
    const logCount = doneTodayItems.filter((i) => i.kind === "log").length;
    const visibleItems =
      doneTodayFilter === "all"
        ? doneTodayItems
        : doneTodayItems.filter((i) => i.kind === doneTodayFilter);
    const toggleFilter = (kind: "task" | "log") =>
      setDoneTodayFilter((cur) => (cur === kind ? "all" : kind));
    sectionNodes["done-today"] = (
      <CollapsibleSection
        open={showDoneToday}
        onToggle={() => setShowDoneToday((s) => !s)}
        icon={<Sparkles size={18} className="text-accent" />}
        title={tDone("title")}
        rightSlot={
          <>
            {taskCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilter("task");
                }}
                aria-pressed={doneTodayFilter === "task"}
                title={
                  doneTodayFilter === "task"
                    ? tDone("showAll")
                    : tDone("showOnlyTasks")
                }
                className={`text-xs font-normal rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors ${
                  doneTodayFilter === "task"
                    ? "bg-accent/25 border border-accent/60 text-accent"
                    : doneTodayFilter === "log"
                    ? "bg-accent/5 border border-accent/15 text-accent/50 hover:text-accent"
                    : "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
                }`}
              >
                <CheckCircle2 size={11} />
                {tDone("tasksLabel", { count: taskCount })}
              </button>
            )}
            {logCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilter("log");
                }}
                aria-pressed={doneTodayFilter === "log"}
                title={
                  doneTodayFilter === "log"
                    ? tDone("showAll")
                    : tDone("showOnlyLogs")
                }
                className={`text-xs font-normal rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors ${
                  doneTodayFilter === "log"
                    ? "bg-accent-2/25 border border-accent-2/60 text-accent-2"
                    : doneTodayFilter === "task"
                    ? "bg-accent-2/5 border border-accent-2/15 text-accent-2/50 hover:text-accent-2"
                    : "bg-accent-2/10 border border-accent-2/30 text-accent-2 hover:bg-accent-2/20"
                }`}
              >
                <TrendingUp size={11} />
                {tDone("logsLabel", { count: logCount })}
              </button>
            )}
            {doneTodayEffortHours > 0 && (
              <span
                className="text-xs font-normal rounded-full px-2 py-0.5 inline-flex items-center gap-1 bg-accent-2/15 text-accent-2 border border-accent-2/40"
                title={tDone("hoursWorkedTooltip")}
              >
                <Clock size={11} />
                {tDone("hoursWorkedLabel", { hours: doneTodayEffortHours })}
              </span>
            )}
          </>
        }
      >
        <div className="bg-surface/40 border border-border rounded-xl p-3 sm:p-4 space-y-3">
          {todayHoursByProject.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/80">
              <span className="text-[10px] uppercase tracking-wider text-text-muted self-center mr-1">
                {tDone("hoursByProject")}
              </span>
              {todayHoursByProject.map(({ project, hours }) => (
                <button
                  key={project.id}
                  onClick={() => onJumpToProject(project)}
                  className="text-xs px-2 py-0.5 rounded border bg-accent/10 text-accent border-accent/30 hover:bg-accent/20 inline-flex items-center gap-1"
                >
                  <Clock size={10} />
                  {project.name} · {hours}h
                </button>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {visibleItems.map((item) => {
              if (item.kind === "task") {
                const taskItem = item.task;
                const proj = projects.find((p) => p.id === taskItem.projectId);
                return (
                  <div
                    key={`task-${taskItem.id}`}
                    className="flex items-start gap-2 group border-l-2 border-accent/40 pl-2.5"
                  >
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-accent">
                          {tDone("task")}
                        </span>
                        {proj && (
                          <button
                            onClick={() => onJumpToProject(proj)}
                            className="text-xs text-text-muted hover:text-accent hover:underline"
                          >
                            · {proj.name}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-text-muted line-through decoration-emerald-500/40 break-words">
                          {taskItem.title}
                        </span>
                        {taskItem.effortHours != null && (
                          <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
                            <Clock size={10} />
                            {taskItem.effortHours}h
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onEditTask(taskItem)}
                      className="text-text-muted hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      title={tDone("edit")}
                      aria-label={tDone("editTaskAria")}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onToggleTask(taskItem)}
                      className="text-text-muted hover:text-amber-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      title={tDone("undo")}
                      aria-label={tDone("undoAria")}
                    >
                      <Undo2 size={14} />
                    </button>
                  </div>
                );
              }
              if (item.kind === "routine") {
                return (
                  <div
                    key={`routine-${item.occurrenceId}`}
                    className="flex items-start gap-2 group border-l-2 border-accent/40 pl-2.5"
                  >
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-accent">
                          {tDone("routine")}
                        </span>
                        <span className="text-xs text-text-muted">
                          · {tTabs("routines")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-text-muted break-words">
                          {item.title}
                        </span>
                        {item.effortHours != null && (
                          <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
                            <Clock size={10} />
                            {item.effortHours}h
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onUncompleteOccurrence(item.occurrenceId)}
                      className="text-text-muted hover:text-amber-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      title={tDone("undo")}
                      aria-label={tDone("undoAria")}
                    >
                      <Undo2 size={14} />
                    </button>
                  </div>
                );
              }
              const proj = projects.find((p) => p.id === item.projectId);
              const badgeKey = item.source === "projectNote" ? "note" : "log";
              return (
                <div
                  key={`log-${item.source}-${item.id}`}
                  className="flex items-start gap-2 border-l-2 border-accent-2/40 pl-2.5"
                >
                  <TrendingUp size={16} className="text-accent-2 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[10px] uppercase tracking-wider font-medium text-accent-2">
                        {tDone(badgeKey)}
                      </span>
                      {proj && (
                        <button
                          onClick={() => onJumpToProject(proj)}
                          className="text-xs text-text-muted hover:text-accent hover:underline"
                        >
                          · {proj.name}
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-text-muted break-words">
                      {item.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CollapsibleSection>
    );
  }

  if (closableTotal > 0) {
    sectionNodes.closeable = (
      <CollapsibleSection
        open={showCloseable}
        onToggle={() => setShowCloseable((s) => !s)}
        icon={<Flag size={18} className="text-accent" />}
        title={tCloseable("title")}
        rightSlot={
          <span className="text-xs font-normal text-accent bg-accent/10 border border-accent/30 rounded-full px-2 py-0.5">
            {closableTotal}
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {closableProjects.almostThere.map((s) => {
            const pct = Math.round(s.donePct * 100);
            return (
              <button
                key={`almost-${s.project.id}`}
                onClick={() => onJumpToProject(s.project)}
                className="text-left bg-accent/5 border border-accent/30 rounded-xl p-4 hover:border-accent/50 transition-all"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wider font-medium text-accent">
                    {tCloseable("almostThereChip", { pct })}
                  </span>
                </div>
                <div className="font-semibold mb-2 truncate">{s.project.name}</div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden mb-2">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-text-muted">
                  {tCloseable("tasksLeft", {
                    count: s.openCount,
                    done: s.doneCount,
                    total: s.totalCount,
                  })}
                </div>
              </button>
            );
          })}
          {closableProjects.quickWins.map((s) => (
            <button
              key={`quick-${s.project.id}`}
              onClick={() => onJumpToProject(s.project)}
              className="text-left bg-surface border border-border rounded-xl p-4 hover:border-accent/40 transition-all"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-medium text-accent">
                  {tCloseable("quickWin")}
                </span>
              </div>
              <div className="font-semibold mb-2 truncate">{s.project.name}</div>
              <div className="text-xs text-text-muted">
                {tCloseable("tasksAway", { count: s.openCount })}
              </div>
            </button>
          ))}
        </div>
      </CollapsibleSection>
    );
  }

  if (sleepingProjects.length > 0) {
    sectionNodes.sleeping = (
      <CollapsibleSection
        open={showSleepingProjects}
        onToggle={() => setShowSleepingProjects((s) => !s)}
        icon={<Moon size={18} className="text-amber-400" />}
        title={tSleep("title")}
        rightSlot={
          <span className="text-xs font-normal text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
            {sleepingProjects.length}
          </span>
        }
      >
        <div className="space-y-2">
          {sleepingProjects.map(({ project, days, bucket }) => {
            const style = sleepingBucketStyle[bucket];
            return (
              <div
                key={project.id}
                className={`flex items-center gap-3 p-3 rounded-xl border bg-surface/60 border-border hover:border-border transition-colors`}
              >
                <span className={`shrink-0 w-2 h-2 rounded-full ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onJumpToProject(project)}
                      className="font-semibold text-text truncate hover:text-accent"
                    >
                      {project.name}
                    </button>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${style.chip}`}
                    >
                      {tSleep("daysIdle", { count: days })}
                    </span>
                  </div>
                  {project.nextStep && (
                    <div className="text-xs text-text-muted truncate mt-0.5">
                      → {project.nextStep}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onLogUpdate(project)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25 transition-colors"
                >
                  {tSleep("resume")}
                </button>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
    );
  }

  if (staleIdeas.length > 0) {
    sectionNodes["stale-ideas"] = (
      <button
        onClick={onJumpToIdeas}
        className="w-full text-left bg-purple-500/5 border border-purple-500/30 rounded-xl p-4 hover:bg-purple-500/10 transition-colors"
      >
        <div className="flex items-start gap-3">
          <Lightbulb
            className="text-purple-700 dark:text-purple-300 shrink-0 mt-0.5"
            size={18}
          />
          <div className="flex-1">
            <div className="font-semibold text-purple-700 dark:text-purple-200 mb-1">
              {tStale("title", { count: staleIdeas.length })}
            </div>
            <div className="text-sm text-purple-700/70 dark:text-purple-200/70">
              {tStale("subtitle")}
            </div>
          </div>
          <ChevronRight
            className="text-purple-700 dark:text-purple-300 shrink-0 mt-0.5"
            size={18}
          />
        </div>
      </button>
    );
  }

  if (activeProjectsCount > 0) {
    sectionNodes["active-projects"] = (
      <CollapsibleSection
        open={showActiveProjects}
        onToggle={() => setShowActiveProjects((s) => !s)}
        icon={<Zap size={18} className="text-accent" />}
        title={t("active.title")}
        rightSlot={
          <span className="text-xs font-normal text-accent bg-accent/10 border border-accent/30 rounded-full px-2 py-0.5">
            {activeProjectsCount}
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects
            .filter((p) => p.status === "active")
            .map((p) => {
              const stats = projectProgressById.get(p.id);
              return (
                <ProjectCardCompact
                  key={p.id}
                  project={p}
                  projectTasks={tasks.filter((tt) => tt.projectId === p.id)}
                  variant="active"
                  categoryById={categoryById}
                  totalEffortHours={stats?.totalEffortHours}
                  todayEffortHours={stats?.todayEffortHours}
                  comebackGapDays={
                    comebackProjectIds.has(p.id)
                      ? comebackGapByProject.get(p.id) ?? null
                      : null
                  }
                  onClick={() => onJumpToProject(p)}
                />
              );
            })}
        </div>
      </CollapsibleSection>
    );
  }

  if (launchedWithOpenTasks.length > 0) {
    sectionNodes["launched-with-tasks"] = (
      <CollapsibleSection
        open={showLaunchedWithTasks}
        onToggle={() => setShowLaunchedWithTasks((s) => !s)}
        icon={<Rocket size={18} className="text-accent-2" />}
        title={t("launched.title")}
        rightSlot={
          <span className="text-xs font-normal text-accent-2/80 bg-accent-2/10 border border-accent-2/30 rounded-full px-2 py-0.5">
            {launchedWithOpenTasks.length}
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {launchedWithOpenTasks.map(({ project: p, projectTasks }) => {
            const stats = projectProgressById.get(p.id);
            return (
              <ProjectCardCompact
                key={p.id}
                project={p}
                projectTasks={projectTasks}
                variant="launched"
                categoryById={categoryById}
                totalEffortHours={stats?.totalEffortHours}
                todayEffortHours={stats?.todayEffortHours}
                comebackGapDays={
                  comebackProjectIds.has(p.id)
                    ? comebackGapByProject.get(p.id) ?? null
                    : null
                }
                onClick={() => onJumpToProject(p)}
              />
            );
          })}
        </div>
      </CollapsibleSection>
    );
  }

  // ---------- Render ---------- //

  const enterEdit = () => layout.setEditMode(true);
  const exitEdit = () => {
    layout.setEditMode(false);
    // Refresh dashboard so any section that gained data while customizing
    // (or was hidden then unhidden) reflects the latest server state.
    if (onRefresh) {
      void Promise.resolve(onRefresh()).catch(() => undefined);
    }
  };

  const hideLabels = {
    show: tCustom("show"),
    hide: tCustom("hide"),
    locked: tCustom("alwaysVisible"),
    drag: tCustom("dragToReorder"),
  };

  const customizeButton = (
    <button
      type="button"
      onClick={enterEdit}
      aria-label={tCustom("entry")}
      title={tCustom("entry")}
      className="shrink-0 p-2 rounded-md text-text-muted hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] transition-colors"
    >
      <Settings2 size={18} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Greeting + customize entry (mobile inline; desktop top-right) */}
      <div className="md:hidden flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-text-muted capitalize">{formattedDate}</div>
          <h1 className="text-2xl font-semibold mt-0.5 truncate">
            {tGreeting(greetingKey())}
          </h1>
        </div>
        {!layout.editMode && customizeButton}
      </div>
      <div className="hidden md:flex items-center justify-end -mb-3">
        {!layout.editMode && customizeButton}
      </div>

      {layout.editMode ? (
        <>
          <TodayCustomizeBar
            onExit={exitEdit}
            onReset={layout.reset}
            labels={{
              title: tCustom("title"),
              close: tCustom("close"),
              reset: tCustom("reset"),
              done: tCustom("done"),
            }}
          />
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={layout.order}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {layout.order.map((id) => {
                  const meta = TODAY_SECTIONS.find((s) => s.id === id);
                  if (!meta) return null;
                  return (
                    <TodaySection
                      key={id}
                      id={id}
                      editMode
                      hidden={layout.hidden.has(id)}
                      hideable={meta.hideable}
                      label={tSections(meta.labelKey)}
                      icon={SECTION_ICON[id]}
                      badge={
                        MOBILE_ONLY_SECTIONS.has(id) ? tCustom("mobileOnly") : undefined
                      }
                      onToggleHide={() => layout.toggleVisibility(id)}
                      hideLabels={hideLabels}
                    >
                      {/* Children unused in edit mode but kept for type satisfaction. */}
                      {null}
                    </TodaySection>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </>
      ) : (
        <>
          {layout.order
            .filter((id) => !layout.hidden.has(id))
            .map((id) => {
              const node = sectionNodes[id];
              if (!node) return null;
              return <Fragment key={id}>{node}</Fragment>;
            })}
          <HiddenSectionsFooter
            count={layout.hidden.size}
            onCustomize={enterEdit}
            label={tCustom("hiddenFooter", { count: layout.hidden.size })}
          />
        </>
      )}

      {!layout.editMode && (
        <FAB
          icon={<Plus size={24} />}
          label={tFab("open")}
          onClick={() => setShowFabSheet(true)}
        />
      )}

      <TodayActionSheet
        open={showFabSheet && !layout.editMode}
        onClose={() => setShowFabSheet(false)}
        onNewTask={onNewTask}
        onNewProject={onNewProject}
        onNewIdea={onNewIdea}
        onNewRoutine={onNewRoutine}
      />
    </div>
  );
}
