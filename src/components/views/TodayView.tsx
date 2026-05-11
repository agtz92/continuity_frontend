"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Edit2,
  Flag,
  Lightbulb,
  Moon,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, Project, Task, UpdateEntry } from "@/lib/types";
import { daysOverdue, daysSince } from "@/lib/date";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { ProjectCardCompact } from "../projects/ProjectCardCompact";
import { useTodayFocus } from "@/hooks/useTodayFocus";
import type { useProductivityStats } from "@/hooks/useProductivityStats";

type ProductivityStats = ReturnType<typeof useProductivityStats>;

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

export function TodayView({
  projects,
  tasks,
  updates,
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
  onLogUpdate,
  onToggleTask,
  onEditTask,
}: {
  projects: Project[];
  tasks: Task[];
  updates: UpdateEntry[];
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
  onLogUpdate: (p: Project) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
}) {
  const t = useTranslations("views.today");
  const tFocus = useTranslations("views.today.focus");
  const tDone = useTranslations("views.today.doneToday");
  const tCloseable = useTranslations("views.today.closeable");
  const tSleep = useTranslations("views.today.sleeping");
  const tStale = useTranslations("views.today.staleIdeas");

  const {
    stalled,
    todayFocus,
    todayTaskCounts,
    todayEffortHours,
    doneTodayItems,
    doneTodayEffortHours,
    launchedWithOpenTasks,
  } = useTodayFocus({ projects, tasks, updates });

  const {
    sleepingProjects,
    closableProjects,
    staleIdeas,
    todayHoursByProject,
    projectProgressById,
    comebackProjectIds,
    comebackGapByProject,
  } = productivityStats;

  const [showTodayFocus, setShowTodayFocus] = useState(true);
  const [showDoneToday, setShowDoneToday] = useState(true);
  const [showActiveProjects, setShowActiveProjects] = useState(true);
  const [showLaunchedWithTasks, setShowLaunchedWithTasks] = useState(true);
  const [showSleepingProjects, setShowSleepingProjects] = useState(true);
  const [showCloseable, setShowCloseable] = useState(true);
  const [doneTodayFilter, setDoneTodayFilter] = useState<"all" | "task" | "log">("all");

  const closableTotal =
    closableProjects.quickWins.length + closableProjects.almostThere.length;

  return (
    <div className="space-y-6">
      {backupOverdue && hasData && (
        <div className="bg-accent-2/10 border border-accent-2/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Database className="text-accent-2 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="font-semibold text-accent-2 mb-1">
                {lastBackup
                  ? t("backupAlert.lastBackupAgo", { days: daysSinceBackup ?? 0 })
                  : t("backupAlert.noBackup")}
              </div>
              <div className="text-sm text-accent-2/80 mb-2">
                {t("backupAlert.explanation")}
              </div>
              <button
                onClick={onOpenBackupModal}
                className="text-xs px-3 py-1.5 bg-accent-2/20 hover:bg-accent-2/30 rounded-md text-accent-2"
              >
                {t("backupAlert.openTools")}
              </button>
            </div>
          </div>
        </div>
      )}

      {stalled.length > 0 && (
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
      )}

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
                  className={`p-4 rounded-xl border transition-all hover:border-border ${
                    item.type === "overdue"
                      ? "bg-red-500/5 border-red-500/30"
                      : item.type === "today"
                      ? "bg-orange-500/5 border-orange-500/30"
                      : item.type === "stalled"
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-surface border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`shrink-0 w-2 h-2 rounded-full mt-2 ${
                        item.type === "overdue"
                          ? "bg-red-400"
                          : item.type === "today"
                          ? "bg-orange-400"
                          : item.type === "stalled"
                          ? "bg-amber-400"
                          : "bg-accent"
                      }`}
                    />
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
                    {item.task && (
                      <button
                        onClick={() => onToggleTask(item.task!)}
                        className="shrink-0 text-text-muted hover:text-accent transition-colors"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}
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

      {doneTodayItems.length > 0 && (() => {
        const taskCount = doneTodayItems.filter((i) => i.kind === "task").length;
        const logCount = doneTodayItems.filter((i) => i.kind === "log").length;
        const visibleItems =
          doneTodayFilter === "all"
            ? doneTodayItems
            : doneTodayItems.filter((i) => i.kind === doneTodayFilter);
        const toggleFilter = (kind: "task" | "log") =>
          setDoneTodayFilter((cur) => (cur === kind ? "all" : kind));
        return (
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
                        <CheckCircle2
                          size={16}
                          className="text-accent shrink-0 mt-0.5"
                        />
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
                          <X size={14} />
                        </button>
                      </div>
                    );
                  }
                  const u = item.update;
                  const proj = projects.find((p) => p.id === u.projectId);
                  return (
                    <div
                      key={`log-${u.id}`}
                      className="flex items-start gap-2 border-l-2 border-accent-2/40 pl-2.5"
                    >
                      <TrendingUp
                        size={16}
                        className="text-accent-2 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-medium text-accent-2">
                            {tDone("log")}
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
                          {u.note}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CollapsibleSection>
        );
      })()}

      {closableTotal > 0 && (
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
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
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
      )}

      {sleepingProjects.length > 0 && (
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
      )}

      {staleIdeas.length > 0 && (
        <button
          onClick={onJumpToIdeas}
          className="w-full text-left bg-purple-500/5 border border-purple-500/30 rounded-xl p-4 hover:bg-purple-500/10 transition-colors"
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="text-purple-700 dark:text-purple-300 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="font-semibold text-purple-700 dark:text-purple-200 mb-1">
                {tStale("title", { count: staleIdeas.length })}
              </div>
              <div className="text-sm text-purple-700/70 dark:text-purple-200/70">{tStale("subtitle")}</div>
            </div>
            <ChevronRight className="text-purple-700 dark:text-purple-300 shrink-0 mt-0.5" size={18} />
          </div>
        </button>
      )}

      {projects.filter((p) => p.status === "active").length > 0 && (
        <CollapsibleSection
          open={showActiveProjects}
          onToggle={() => setShowActiveProjects((s) => !s)}
          icon={<Zap size={18} className="text-accent" />}
          title={t("active.title")}
          rightSlot={
            <span className="text-xs font-normal text-accent bg-accent/10 border border-accent/30 rounded-full px-2 py-0.5">
              {projects.filter((p) => p.status === "active").length}
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
      )}

      {launchedWithOpenTasks.length > 0 && (
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
      )}
    </div>
  );
}
