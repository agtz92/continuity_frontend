"use client";

import { useMemo, useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  ListFilter,
  Plus,
  Search,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project, Task } from "@/lib/types";
import {
  dueDateOnly,
  isDueToday,
  isOverdue,
  toLocalISO,
  todayLocalISODate,
} from "@/lib/date";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { FAB } from "../ui/FAB";
import { TaskRow } from "../tasks/TaskRow";
import {
  EMPTY_TASK_FILTER,
  TasksFilterSheet,
  type TaskFilterDraft,
} from "./TasksFilterSheet";

type TaskRange = "today" | "week" | "all";

export function TasksView({
  tasks,
  projects,
  onNewTask,
  onEditTask,
  onToggleTask,
  onDeleteTask,
}: {
  tasks: Task[];
  projects: Project[];
  onNewTask: () => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void | Promise<void>;
  onDeleteTask: (id: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.tasks");
  const tCommon = useTranslations("common");
  const [taskSearch, setTaskSearch] = useState("");
  const [showOverdueTasks, setShowOverdueTasks] = useState(true);
  const [showTodayTasks, setShowTodayTasks] = useState(true);
  const [showUnscheduledTasks, setShowUnscheduledTasks] = useState(false);
  const [showUpcomingTasks, setShowUpcomingTasks] = useState(false);
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [taskRange, setTaskRange] = useState<TaskRange>("all");
  const [taskFilter, setTaskFilter] = useState<TaskFilterDraft>(EMPTY_TASK_FILTER);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const weekHorizonISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toLocalISO(d);
  }, []);

  const matchesProjectFilter = (task: Task, draft: TaskFilterDraft) => {
    if (draft.projectIds.size === 0) return true;
    return draft.projectIds.has(task.projectId);
  };

  const matchesCompletedFilter = (task: Task, draft: TaskFilterDraft) =>
    draft.showCompleted || !task.done;

  const passesUserFilter = (task: Task) =>
    matchesProjectFilter(task, taskFilter) &&
    matchesCompletedFilter(task, taskFilter);

  const previewCount = (draft: TaskFilterDraft) =>
    tasks.filter(
      (task) =>
        matchesProjectFilter(task, draft) &&
        matchesCompletedFilter(task, draft)
    ).length;

  const hasUnassigned = tasks.some((task) => !task.projectId);

  const activeFilterCount =
    taskFilter.projectIds.size + (taskFilter.showCompleted ? 0 : 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-text-muted"
            />
          </div>
          <button
            onClick={onNewTask}
            className="px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm hidden md:flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> {tCommon("new")}
          </button>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="md:hidden mb-3 flex gap-2">
          <RangeSegmented value={taskRange} onChange={setTaskRange} />
          <button
            type="button"
            onClick={() => setShowFilterSheet(true)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text flex items-center justify-center gap-1.5 shrink-0"
          >
            <ListFilter size={14} />
            <span>{t("filterCta")}</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-bg text-[10px] font-semibold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted mb-4">{t("empty")}</p>
          <button
            onClick={onNewTask}
            className="px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm"
          >
            {t("addFirst")}
          </button>
        </div>
      ) : (() => {
        const q = taskSearch.trim().toLowerCase();
        const matchesSearch = (task: Task) => {
          if (!q) return true;
          const proj = projects.find((p) => p.id === task.projectId);
          return (
            task.title.toLowerCase().includes(q) ||
            (proj?.name.toLowerCase().includes(q) ?? false)
          );
        };

        const filteredTasks = tasks.filter(
          (task) => matchesSearch(task) && passesUserFilter(task)
        );

        if (filteredTasks.length === 0) {
          return (
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
              {q ? t("noMatch", { query: taskSearch }) : t("empty")}
            </div>
          );
        }

        const overdueBucket = filteredTasks
          .filter((task) => !task.done && task.dueDate && isOverdue(task.dueDate))
          .sort(
            (a, b) =>
              new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          );

        const todayBucket = filteredTasks
          .filter(
            (task) => !task.done && task.dueDate && isDueToday(task.dueDate)
          )
          .sort(
            (a, b) =>
              new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          );

        const unscheduledBucket = filteredTasks
          .filter((task) => !task.done && !task.dueDate)
          .sort(
            (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
          );

        const upcomingAll = filteredTasks
          .filter(
            (task) =>
              !task.done &&
              task.dueDate &&
              !isOverdue(task.dueDate) &&
              !isDueToday(task.dueDate)
          )
          .sort(
            (a, b) =>
              new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          );

        const upcomingBucket =
          taskRange === "week"
            ? upcomingAll.filter(
                (task) => dueDateOnly(task.dueDate!) <= weekHorizonISO
              )
            : upcomingAll;

        const doneBucket = filteredTasks
          .filter((task) => task.done)
          .sort((a, b) => {
            const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return tb - ta;
          });

        const searching = q.length > 0;
        const overdueOpen = searching || showOverdueTasks;
        const todayOpen = searching || showTodayTasks;
        const unscheduledOpen = searching || showUnscheduledTasks;
        const upcomingOpen = searching || showUpcomingTasks;
        const doneOpen = searching || showDoneTasks;

        const showUpcoming = taskRange !== "today";
        const showUnscheduled = taskRange === "all";
        // Independent of taskRange: the range filter scopes by due-date
        // horizon, but completed tasks have no horizon — keep the bucket
        // reachable in every range so an accidental completion can be undone.
        const showDone = taskFilter.showCompleted;

        const renderRow = (task: Task, opts?: { canSchedule?: boolean }) => (
          <TaskRow
            key={task.id}
            task={task}
            project={projects.find((p) => p.id === task.projectId)}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onSchedule={opts?.canSchedule ? onEditTask : undefined}
            onEdit={onEditTask}
          />
        );

        return (
          <div className="space-y-3">
            {overdueBucket.length > 0 && (
              <CollapsibleSection
                variant="card"
                open={overdueOpen}
                onToggle={() => setShowOverdueTasks((s) => !s)}
                icon={<Target size={14} className="text-red-400" />}
                title={t("overdueBucket")}
                rightSlot={
                  <span className="text-xs text-red-700 dark:text-red-300 bg-red-500/10 border border-red-500/30 rounded-full px-2 py-0.5">
                    {overdueBucket.length}
                  </span>
                }
              >
                <div className="space-y-2">
                  {overdueBucket.map((task) => renderRow(task))}
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection
              variant="card"
              open={todayOpen}
              onToggle={() => setShowTodayTasks((s) => !s)}
              icon={<Target size={14} className="text-orange-400" />}
              title={t("todayOnlyBucket")}
              rightSlot={
                <span className="text-xs text-orange-700 dark:text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
                  {todayBucket.length}
                </span>
              }
            >
              {todayBucket.length === 0 ? (
                <div className="text-center text-sm text-text-muted py-4">
                  {t("todayEmpty")}
                </div>
              ) : (
                <div className="space-y-2">
                  {todayBucket.map((task) => renderRow(task))}
                </div>
              )}
            </CollapsibleSection>

            {showUpcoming && upcomingBucket.length > 0 && (
              <CollapsibleSection
                variant="card"
                open={upcomingOpen}
                onToggle={() => setShowUpcomingTasks((s) => !s)}
                icon={<Clock size={14} className="text-accent-2" />}
                title={t("upcoming")}
                rightSlot={
                  <span className="text-xs text-accent-2 bg-accent-2/10 border border-accent-2/30 rounded-full px-2 py-0.5">
                    {upcomingBucket.length}
                  </span>
                }
              >
                <div className="space-y-2">
                  {upcomingBucket.map((task) => renderRow(task))}
                </div>
              </CollapsibleSection>
            )}

            {showUnscheduled && unscheduledBucket.length > 0 && (
              <CollapsibleSection
                variant="card"
                open={unscheduledOpen}
                onToggle={() => setShowUnscheduledTasks((s) => !s)}
                icon={<CalendarPlus size={14} className="text-amber-400" />}
                title={t("pickDay")}
                rightSlot={
                  <>
                    <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                      {unscheduledBucket.length}
                    </span>
                    <span className="hidden sm:inline text-xs text-text-muted ml-1">
                      {t("pickDayHint")}
                    </span>
                  </>
                }
              >
                <div className="space-y-2">
                  {unscheduledBucket.map((task) =>
                    renderRow(task, { canSchedule: true })
                  )}
                </div>
              </CollapsibleSection>
            )}

            {showDone && doneBucket.length > 0 && (
              <CollapsibleSection
                variant="card"
                open={doneOpen}
                onToggle={() => setShowDoneTasks((s) => !s)}
                icon={<CheckCircle2 size={14} className="text-accent" />}
                title={t("completed")}
                rightSlot={
                  <span className="text-xs text-accent bg-accent/10 border border-accent/30 rounded-full px-2 py-0.5">
                    {doneBucket.length}
                  </span>
                }
              >
                <div className="space-y-2">
                  {doneBucket.map((task) => renderRow(task))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        );
      })()}

      <FAB
        icon={<Plus size={24} />}
        label={t("newAria")}
        onClick={onNewTask}
      />

      <TasksFilterSheet
        open={showFilterSheet}
        initial={taskFilter}
        projects={projects}
        hasUnassigned={hasUnassigned}
        previewCount={previewCount}
        onApply={setTaskFilter}
        onClose={() => setShowFilterSheet(false)}
      />
    </div>
  );
}

function RangeSegmented({
  value,
  onChange,
}: {
  value: TaskRange;
  onChange: (next: TaskRange) => void;
}) {
  const t = useTranslations("views.tasks.range");
  const ranges: TaskRange[] = ["today", "week", "all"];
  return (
    <div
      role="radiogroup"
      aria-label={t("all")}
      className="flex-1 bg-surface border border-border rounded-lg p-0.5 flex"
    >
      {ranges.map((range) => {
        const active = value === range;
        return (
          <button
            key={range}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(range)}
            className={`flex-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-bg"
                : "text-text-muted hover:text-text"
            }`}
          >
            {t(range)}
          </button>
        );
      })}
    </div>
  );
}
