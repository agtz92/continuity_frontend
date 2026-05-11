"use client";

import { useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project, Task } from "@/lib/types";
import { isDueToday, isOverdue } from "@/lib/date";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { TaskRow } from "../tasks/TaskRow";

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
  const [showTodayTasks, setShowTodayTasks] = useState(true);
  const [showUnscheduledTasks, setShowUnscheduledTasks] = useState(false);
  const [showUpcomingTasks, setShowUpcomingTasks] = useState(false);
  const [showDoneTasks, setShowDoneTasks] = useState(false);

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
            className="px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> {tCommon("new")}
          </button>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-muted">
          {t("empty")}
        </div>
      ) : (() => {
        const q = taskSearch.trim().toLowerCase();
        const filteredTasks = q
          ? tasks.filter((t) => {
              const proj = projects.find((p) => p.id === t.projectId);
              return (
                t.title.toLowerCase().includes(q) ||
                (proj?.name.toLowerCase().includes(q) ?? false)
              );
            })
          : tasks;

        if (filteredTasks.length === 0) {
          return (
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
              {t("noMatch", { query: taskSearch })}
            </div>
          );
        }

        const todayBucket = filteredTasks
          .filter(
            (t) =>
              !t.done && t.dueDate && (isOverdue(t.dueDate) || isDueToday(t.dueDate))
          )
          .sort(
            (a, b) =>
              new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          );

        const unscheduledBucket = filteredTasks
          .filter((t) => !t.done && !t.dueDate)
          .sort(
            (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
          );

        const upcomingBucket = filteredTasks
          .filter(
            (t) =>
              !t.done &&
              t.dueDate &&
              !isOverdue(t.dueDate) &&
              !isDueToday(t.dueDate)
          )
          .sort(
            (a, b) =>
              new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          );

        const doneBucket = filteredTasks
          .filter((t) => t.done)
          .sort((a, b) => {
            const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return tb - ta;
          });

        const searching = q.length > 0;
        const todayOpen = searching || showTodayTasks;
        const unscheduledOpen = searching || showUnscheduledTasks;
        const upcomingOpen = searching || showUpcomingTasks;
        const doneOpen = searching || showDoneTasks;

        const renderRow = (t: Task, opts?: { canSchedule?: boolean }) => (
          <TaskRow
            key={t.id}
            task={t}
            project={projects.find((p) => p.id === t.projectId)}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onSchedule={opts?.canSchedule ? onEditTask : undefined}
            onEdit={onEditTask}
          />
        );

        return (
          <div className="space-y-3">
            <CollapsibleSection
              variant="card"
              open={todayOpen}
              onToggle={() => setShowTodayTasks((s) => !s)}
              icon={<Target size={14} className="text-orange-400" />}
              title={t("todayBucket")}
              rightSlot={
                <span className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
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
                  {todayBucket.map((t) => renderRow(t))}
                </div>
              )}
            </CollapsibleSection>

            {unscheduledBucket.length > 0 && (
              <CollapsibleSection
                variant="card"
                open={unscheduledOpen}
                onToggle={() => setShowUnscheduledTasks((s) => !s)}
                icon={<CalendarPlus size={14} className="text-amber-400" />}
                title={t("pickDay")}
                rightSlot={
                  <>
                    <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                      {unscheduledBucket.length}
                    </span>
                    <span className="hidden sm:inline text-xs text-text-muted ml-1">
                      {t("pickDayHint")}
                    </span>
                  </>
                }
              >
                <div className="space-y-2">
                  {unscheduledBucket.map((t) => renderRow(t, { canSchedule: true }))}
                </div>
              </CollapsibleSection>
            )}

            {upcomingBucket.length > 0 && (
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
                  {upcomingBucket.map((t) => renderRow(t))}
                </div>
              </CollapsibleSection>
            )}

            {doneBucket.length > 0 && (
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
                  {doneBucket.map((t) => renderRow(t))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        );
      })()}
    </div>
  );
}
