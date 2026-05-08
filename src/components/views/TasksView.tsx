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
  const [taskSearch, setTaskSearch] = useState("");
  const [showTodayTasks, setShowTodayTasks] = useState(true);
  const [showUnscheduledTasks, setShowUnscheduledTasks] = useState(false);
  const [showUpcomingTasks, setShowUpcomingTasks] = useState(false);
  const [showDoneTasks, setShowDoneTasks] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">All Tasks</h2>
        <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Search tasks or project..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-zinc-600"
            />
          </div>
          <button
            onClick={onNewTask}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
          No tasks yet.
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
              No tasks match &ldquo;{taskSearch}&rdquo;
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
          />
        );

        return (
          <div className="space-y-3">
            <CollapsibleSection
              variant="card"
              open={todayOpen}
              onToggle={() => setShowTodayTasks((s) => !s)}
              icon={<Target size={14} className="text-orange-400" />}
              title="Today & overdue"
              rightSlot={
                <span className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
                  {todayBucket.length}
                </span>
              }
            >
              {todayBucket.length === 0 ? (
                <div className="text-center text-sm text-zinc-500 py-4">
                  All clear — nothing due today. ✨
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
                title="Pick a day"
                rightSlot={
                  <>
                    <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                      {unscheduledBucket.length}
                    </span>
                    <span className="hidden sm:inline text-xs text-zinc-500 ml-1">
                      — schedule them so they happen
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
                icon={<Clock size={14} className="text-blue-400" />}
                title="Upcoming"
                rightSlot={
                  <span className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-full px-2 py-0.5">
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
                icon={<CheckCircle2 size={14} className="text-emerald-400" />}
                title="Completed"
                rightSlot={
                  <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
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
