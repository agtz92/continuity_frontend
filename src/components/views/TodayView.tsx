"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Edit2,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import type { Category, Project, Task, UpdateEntry } from "@/lib/types";
import { daysOverdue, daysSince } from "@/lib/date";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { ProjectCardCompact } from "../projects/ProjectCardCompact";
import { useTodayFocus } from "@/hooks/useTodayFocus";

export function TodayView({
  projects,
  tasks,
  updates,
  categoryById,
  lastBackup,
  daysSinceBackup,
  backupOverdue,
  hasData,
  onOpenBackupModal,
  onJumpToProject,
  onJumpToTasks,
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
  onOpenBackupModal: () => void;
  onJumpToProject: (p: Project) => void;
  onJumpToTasks: () => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
}) {
  const {
    stalled,
    todayFocus,
    todayTaskCounts,
    todayEffortHours,
    doneTodayItems,
    doneTodayEffortHours,
    launchedWithOpenTasks,
  } = useTodayFocus({ projects, tasks, updates });

  const [showTodayFocus, setShowTodayFocus] = useState(true);
  const [showDoneToday, setShowDoneToday] = useState(true);
  const [showActiveProjects, setShowActiveProjects] = useState(true);
  const [showLaunchedWithTasks, setShowLaunchedWithTasks] = useState(true);
  const [doneTodayFilter, setDoneTodayFilter] = useState<"all" | "task" | "log">("all");

  return (
    <div className="space-y-6">
      {backupOverdue && hasData && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Database className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="font-semibold text-blue-300 mb-1">
                {lastBackup
                  ? `Last backup ${daysSinceBackup} days ago`
                  : "No backup yet"}
              </div>
              <div className="text-sm text-blue-200/80 mb-2">
                Export a JSON backup so you don&apos;t lose your data.
              </div>
              <button
                onClick={onOpenBackupModal}
                className="text-xs px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-md text-blue-200"
              >
                Open backup tools
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
              <div className="font-semibold text-amber-300 mb-1">
                {stalled.length} project{stalled.length > 1 ? "s" : ""} need
                {stalled.length === 1 ? "s" : ""} attention
              </div>
              <div className="text-sm text-amber-200/80">
                No activity in 7+ days. Don&apos;t let them quietly die.
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {stalled.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onJumpToProject(p)}
                    className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-md text-amber-200"
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
        icon={<Target size={18} className="text-emerald-400" />}
        title="Today's Focus"
        rightSlot={
          todayTaskCounts.total > 0 ? (
            <span className="inline-flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-200 shadow-sm shadow-orange-500/10"
                title={`${todayTaskCounts.dueToday} due today · ${todayTaskCounts.overdue} overdue`}
              >
                <Target size={11} className="text-orange-300" />
                <span>
                  {todayTaskCounts.total}{" "}
                  {todayTaskCounts.total === 1 ? "task" : "tasks"}
                </span>
                {todayTaskCounts.overdue > 0 && (
                  <span className="text-red-300 font-semibold">
                    · {todayTaskCounts.overdue} overdue
                  </span>
                )}
              </span>
              {todayEffortHours > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-500/15 text-blue-200 border-blue-500/40"
                  title="Total estimated hours for tasks due today + overdue"
                >
                  <Clock size={11} className="text-blue-300" />
                  {todayEffortHours}h total
                </span>
              )}
            </span>
          ) : null
        }
      >
        <>
          {todayFocus.items.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400 mb-3">Nothing pressing today.</p>
              <p className="text-sm text-zinc-500">
                {projects.length === 0
                  ? "Add your first project to get started."
                  : "Add tasks or next steps to your active projects."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {todayFocus.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all hover:border-zinc-700 ${
                    item.type === "overdue"
                      ? "bg-red-500/5 border-red-500/30"
                      : item.type === "today"
                      ? "bg-orange-500/5 border-orange-500/30"
                      : item.type === "stalled"
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-zinc-900 border-zinc-800"
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
                          : "bg-emerald-400"
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
                              : "text-emerald-400"
                          }`}
                        >
                          {item.type === "overdue"
                            ? "Overdue"
                            : item.type === "today"
                            ? "Due today"
                            : item.type === "stalled"
                            ? "Stalled"
                            : "Next step"}
                        </span>
                        {item.type === "overdue" &&
                          item.task?.dueDate &&
                          (() => {
                            const n = daysOverdue(item.task.dueDate);
                            return n !== null ? (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/25 text-red-200 border border-red-500/50">
                                {n}d late
                              </span>
                            ) : null;
                          })()}
                        {item.project && (
                          <span className="text-xs text-zinc-500">
                            · {item.project.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-zinc-100">
                          {item.task
                            ? item.task.title
                            : item.type === "stalled" && item.project
                            ? `${item.project.name} — ${daysSince(item.project.lastActivity)} days idle`
                            : item.project?.nextStep}
                        </span>
                        {item.task?.effortHours != null && (
                          <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/15 text-blue-300 border-blue-500/30 inline-flex items-center gap-1">
                            <Clock size={10} />
                            {item.task.effortHours}h
                          </span>
                        )}
                      </div>
                    </div>
                    {item.task && (
                      <button
                        onClick={() => onToggleTask(item.task!)}
                        className="shrink-0 text-zinc-500 hover:text-emerald-400 transition-colors"
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
              className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 text-sm font-medium transition-colors"
            >
              View all tasks
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/30 text-orange-100">
                +{todayFocus.total - todayFocus.items.length} more
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
            icon={<Sparkles size={18} className="text-emerald-400" />}
            title="Done today"
            rightSlot={
              <>
                {taskCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFilter("task");
                    }}
                    aria-pressed={doneTodayFilter === "task"}
                    title={doneTodayFilter === "task" ? "Show all" : "Show only tasks"}
                    className={`text-xs font-normal rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors ${
                      doneTodayFilter === "task"
                        ? "bg-emerald-500/25 border border-emerald-500/60 text-emerald-200"
                        : doneTodayFilter === "log"
                        ? "bg-emerald-500/5 border border-emerald-500/15 text-emerald-300/50 hover:text-emerald-300"
                        : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                    }`}
                  >
                    <CheckCircle2 size={11} />
                    {taskCount} {taskCount === 1 ? "task" : "tasks"}
                  </button>
                )}
                {logCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFilter("log");
                    }}
                    aria-pressed={doneTodayFilter === "log"}
                    title={doneTodayFilter === "log" ? "Show all" : "Show only logs"}
                    className={`text-xs font-normal rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors ${
                      doneTodayFilter === "log"
                        ? "bg-blue-500/25 border border-blue-500/60 text-blue-200"
                        : doneTodayFilter === "task"
                        ? "bg-blue-500/5 border border-blue-500/15 text-blue-300/50 hover:text-blue-300"
                        : "bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                    }`}
                  >
                    <TrendingUp size={11} />
                    {logCount} {logCount === 1 ? "log" : "logs"}
                  </button>
                )}
                {doneTodayEffortHours > 0 && (
                  <span
                    className="text-xs font-normal rounded-full px-2 py-0.5 inline-flex items-center gap-1 bg-blue-500/15 text-blue-200 border border-blue-500/40"
                    title="Total estimated hours worked on completed tasks today"
                  >
                    <Clock size={11} />
                    {doneTodayEffortHours}h worked
                  </span>
                )}
              </>
            }
          >
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 sm:p-4">
              <div className="space-y-2">
                {visibleItems.map((item) => {
                  if (item.kind === "task") {
                    const t = item.task;
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <div
                        key={`task-${t.id}`}
                        className="flex items-start gap-2 group border-l-2 border-emerald-500/40 pl-2.5"
                      >
                        <CheckCircle2
                          size={16}
                          className="text-emerald-400 shrink-0 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[10px] uppercase tracking-wider font-medium text-emerald-400">
                              Task
                            </span>
                            {proj && (
                              <span className="text-xs text-zinc-500">
                                · {proj.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-zinc-300 line-through decoration-emerald-500/40 break-words">
                              {t.title}
                            </span>
                            {t.effortHours != null && (
                              <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/15 text-blue-300 border-blue-500/30 inline-flex items-center gap-1">
                                <Clock size={10} />
                                {t.effortHours}h
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onEditTask(t)}
                          className="text-zinc-600 hover:text-emerald-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                          title="Edit"
                          aria-label="Edit task"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onToggleTask(t)}
                          className="text-zinc-600 hover:text-amber-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                          title="Undo"
                          aria-label="Undo completion"
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
                      className="flex items-start gap-2 border-l-2 border-blue-500/40 pl-2.5"
                    >
                      <TrendingUp
                        size={16}
                        className="text-blue-400 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-medium text-blue-400">
                            Log
                          </span>
                          {proj && (
                            <span className="text-xs text-zinc-500">
                              · {proj.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-300 break-words">
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

      {projects.filter((p) => p.status === "active").length > 0 && (
        <CollapsibleSection
          open={showActiveProjects}
          onToggle={() => setShowActiveProjects((s) => !s)}
          icon={<Zap size={18} className="text-emerald-400" />}
          title="Active Projects"
          rightSlot={
            <span className="text-xs font-normal text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
              {projects.filter((p) => p.status === "active").length}
            </span>
          }
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects
              .filter((p) => p.status === "active")
              .map((p) => (
                <ProjectCardCompact
                  key={p.id}
                  project={p}
                  projectTasks={tasks.filter((t) => t.projectId === p.id)}
                  variant="active"
                  categoryById={categoryById}
                  onClick={() => onJumpToProject(p)}
                />
              ))}
          </div>
        </CollapsibleSection>
      )}

      {launchedWithOpenTasks.length > 0 && (
        <CollapsibleSection
          open={showLaunchedWithTasks}
          onToggle={() => setShowLaunchedWithTasks((s) => !s)}
          icon={<Rocket size={18} className="text-blue-400" />}
          title="Launched · still has tasks"
          rightSlot={
            <span className="text-xs font-normal text-blue-400/80 bg-blue-500/10 border border-blue-500/30 rounded-full px-2 py-0.5">
              {launchedWithOpenTasks.length}
            </span>
          }
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {launchedWithOpenTasks.map(({ project: p, projectTasks }) => (
              <ProjectCardCompact
                key={p.id}
                project={p}
                projectTasks={projectTasks}
                variant="launched"
                categoryById={categoryById}
                onClick={() => onJumpToProject(p)}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
