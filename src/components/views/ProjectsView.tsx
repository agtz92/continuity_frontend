"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type {
  Category,
  Project,
  ProjectStatus,
  Task,
  UpdateEntry,
} from "@/lib/types";
import {
  categoryColorClass,
  priorityMeta,
  priorityRank,
} from "@/lib/types";
import { daysSince, isDueToday, isOverdue } from "@/lib/date";
import {
  STATUS_FILTER_ORDER,
  statusBorderClass,
  statusConfig,
} from "@/lib/status";

export function ProjectsView({
  projects,
  tasks,
  updates,
  categories,
  categoryById,
  selectedProject,
  onSelectProject,
  onNewProject,
  onEditProject,
  onDeleteProject,
  onAddTaskToProject,
  onLogUpdate,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: {
  projects: Project[];
  tasks: Task[];
  updates: UpdateEntry[];
  categories: Category[];
  categoryById: Record<string, Category>;
  selectedProject: Project | null;
  onSelectProject: (p: Project | null) => void;
  onNewProject: () => void;
  onEditProject: (p: Project) => void;
  onDeleteProject: (id: string) => void | Promise<void>;
  onAddTaskToProject: (projectId: string) => void;
  onLogUpdate: (p: Project) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void | Promise<void>;
}) {
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<
    "all" | ProjectStatus
  >("active");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<string | null>(
    null
  );

  const projectStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: projects.length,
      active: 0,
      idea: 0,
      stalled: 0,
      paused: 0,
      launched: 0,
      archived: 0,
    };
    for (const p of projects) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
      const idle = daysSince(p.lastActivity) ?? 0;
      if (["active", "idea"].includes(p.status) && idle >= 7) {
        counts.stalled = (counts.stalled ?? 0) + 1;
      }
    }
    return counts;
  }, [projects]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">All Projects</h2>
        <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Search by name, description, category..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-zinc-600"
            />
          </div>
          <button
            onClick={onNewProject}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTER_ORDER.map((s) => {
              const isActive = projectStatusFilter === s;
              const count = projectStatusCounts[s] ?? 0;
              if (s !== "all" && count === 0) return null;
              const cfg = s === "all" ? null : statusConfig[s as ProjectStatus];
              const label = s === "all" ? "All" : cfg?.label ?? s;
              return (
                <button
                  key={s}
                  onClick={() => setProjectStatusFilter(s)}
                  aria-pressed={isActive}
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? s === "all"
                        ? "bg-zinc-100/10 border-zinc-300/60 text-zinc-100"
                        : `${cfg?.color} ring-1 ring-current/40`
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] px-1.5 rounded-full ${
                      isActive ? "bg-black/30" : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setProjectCategoryFilter(null)}
                aria-pressed={projectCategoryFilter === null}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  projectCategoryFilter === null
                    ? "bg-zinc-100/10 border-zinc-300/60 text-zinc-100"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                All categories
              </button>
              {categories.map((c) => {
                const isActive = projectCategoryFilter === c.id;
                const cls = categoryColorClass(c.color);
                return (
                  <button
                    key={c.id}
                    onClick={() => setProjectCategoryFilter(isActive ? null : c.id)}
                    aria-pressed={isActive}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? `${cls.chip} ring-1 ring-current/40`
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cls.dot}`} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-400 mb-4">No projects yet.</p>
          <button
            onClick={onNewProject}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm"
          >
            Add your first project
          </button>
        </div>
      ) : (() => {
        const q = projectSearch.trim().toLowerCase();
        const matchesSearch = (p: Project) => {
          if (!q) return true;
          const cat = p.categoryId ? categoryById[p.categoryId]?.name ?? "" : "";
          return (
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.nextStep.toLowerCase().includes(q) ||
            p.why.toLowerCase().includes(q) ||
            cat.toLowerCase().includes(q)
          );
        };

        const matchesStatus = (p: Project) => {
          if (projectStatusFilter === "all") return true;
          if (projectStatusFilter === "stalled") {
            if (p.status === "stalled") return true;
            const idle = daysSince(p.lastActivity) ?? 0;
            return ["active", "idea"].includes(p.status) && idle >= 7;
          }
          return p.status === projectStatusFilter;
        };

        const matchesCategory = (p: Project) =>
          projectCategoryFilter === null || p.categoryId === projectCategoryFilter;

        const filtered = projects.filter(
          (p) => matchesSearch(p) && matchesStatus(p) && matchesCategory(p)
        );

        if (filtered.length === 0) {
          const reason = q
            ? `No projects match "${projectSearch}"`
            : "No projects match these filters";
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
              {reason}
            </div>
          );
        }

        const urgencyBucket = (p: Project) => {
          const projectTasks = tasks.filter((t) => t.projectId === p.id);
          const hasOverdue = projectTasks.some(
            (t) => !t.done && isOverdue(t.dueDate)
          );
          if (hasOverdue) return 0;
          const hasToday = projectTasks.some(
            (t) => !t.done && isDueToday(t.dueDate)
          );
          if (hasToday) return 1;
          const idle = daysSince(p.lastActivity) ?? 0;
          if (["active", "idea"].includes(p.status) && idle >= 7) return 2;
          return 3;
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 auto-rows-min">
            {[...filtered]
              .sort((a, b) => {
                const ba = urgencyBucket(a);
                const bb = urgencyBucket(b);
                if (ba !== bb) return ba - bb;
                const pa = priorityRank(a.priority);
                const pb = priorityRank(b.priority);
                if (pa !== pb) return pa - pb;
                return (
                  new Date(b.lastActivity).getTime() -
                  new Date(a.lastActivity).getTime()
                );
              })
              .map((p) => {
                const projectTasks = tasks.filter((t) => t.projectId === p.id);
                const done = projectTasks.filter((t) => t.done).length;
                const total = projectTasks.length;
                const todayCount = projectTasks.filter(
                  (t) => !t.done && isDueToday(t.dueDate)
                ).length;
                const overdueCount = projectTasks.filter(
                  (t) => !t.done && isOverdue(t.dueDate)
                ).length;
                const pendingEffortRaw = projectTasks
                  .filter((t) => !t.done && t.effortHours != null)
                  .reduce((sum, t) => sum + (t.effortHours as number), 0);
                const pendingEffort = Math.round(pendingEffortRaw * 10) / 10;
                const StatusIcon = statusConfig[p.status]?.icon || Activity;
                const days = daysSince(p.lastActivity) ?? 0;
                const isStalled =
                  ["active", "idea"].includes(p.status) && days >= 7;
                const isExpanded = selectedProject?.id === p.id;

                return (
                  <div
                    key={p.id}
                    className={`bg-zinc-900 border border-l-4 rounded-xl overflow-hidden transition-all ${statusBorderClass[p.status]} ${
                      isStalled ? "border-amber-500/40" : "border-zinc-800"
                    } ${isExpanded ? "ring-1 ring-emerald-500/30 lg:col-span-2" : ""}`}
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-zinc-900/50"
                      onClick={() => onSelectProject(isExpanded ? null : p)}
                    >
                      <div className="flex items-start gap-3">
                        <ChevronRight
                          size={18}
                          className={`shrink-0 mt-0.5 text-zinc-500 transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="text-sm"
                              title={`Priority: ${priorityMeta(p.priority).label}`}
                            >
                              {priorityMeta(p.priority).emoji}
                            </span>
                            <span className="font-semibold">{p.name}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${statusConfig[p.status]?.color}`}
                            >
                              <StatusIcon size={10} />
                              {statusConfig[p.status]?.label}
                            </span>
                            {p.categoryId && categoryById[p.categoryId] && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded border ${
                                  categoryColorClass(
                                    categoryById[p.categoryId].color
                                  ).chip
                                }`}
                              >
                                {categoryById[p.categoryId].name}
                              </span>
                            )}
                            {overdueCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                                {overdueCount} overdue
                              </span>
                            )}
                            {todayCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                                {todayCount} today
                              </span>
                            )}
                            {isStalled && (
                              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {days}d idle
                              </span>
                            )}
                            {pendingEffort > 0 && (
                              <span
                                className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1"
                                title="Sum of effort hours of pending tasks"
                              >
                                <Clock size={10} />
                                {pendingEffort}h pending
                              </span>
                            )}
                          </div>
                          {p.nextStep && (
                            <div className="text-sm text-zinc-400 truncate">
                              → {p.nextStep}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 shrink-0">
                          {total > 0 && `${done}/${total}`}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-zinc-800 p-4 space-y-4">
                        {p.why && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                              Why this matters
                            </div>
                            <div className="text-sm text-zinc-300">{p.why}</div>
                          </div>
                        )}
                        {p.description && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                              Description
                            </div>
                            <div className="text-sm text-zinc-300">
                              {p.description}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs uppercase tracking-wider text-zinc-500">
                              Tasks
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddTaskToProject(p.id);
                              }}
                              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add task
                            </button>
                          </div>
                          {projectTasks.length === 0 ? (
                            <div className="text-sm text-zinc-500 italic">
                              No tasks yet
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {projectTasks.map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center gap-2 group py-1"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleTask(t);
                                    }}
                                    className={`shrink-0 ${
                                      t.done
                                        ? "text-emerald-400"
                                        : "text-zinc-600 hover:text-zinc-400"
                                    }`}
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                  <span
                                    className={`text-sm flex-1 ${
                                      t.done
                                        ? "line-through text-zinc-500"
                                        : "text-zinc-200"
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                  {t.dueDate && (
                                    <span className="text-xs text-zinc-500">
                                      {new Date(t.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  {t.effortHours != null && (
                                    <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/15 text-blue-300 border-blue-500/30 inline-flex items-center gap-1">
                                      <Clock size={10} />
                                      {t.effortHours}h
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditTask(t);
                                    }}
                                    className="text-zinc-600 hover:text-emerald-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                    aria-label="Edit task"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTask(t.id);
                                    }}
                                    className="text-zinc-600 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                    aria-label="Delete task"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs uppercase tracking-wider text-zinc-500">
                              Recent activity
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onLogUpdate(p);
                              }}
                              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Log update
                            </button>
                          </div>
                          <div className="space-y-1">
                            {updates
                              .filter((u) => u.projectId === p.id)
                              .slice(0, 3)
                              .map((u) => (
                                <div
                                  key={u.id}
                                  className="text-sm text-zinc-400 flex flex-col sm:flex-row gap-0.5 sm:gap-2"
                                >
                                  <span className="text-zinc-600 text-xs shrink-0 sm:w-20">
                                    {new Date(u.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  <span className="break-words min-w-0">{u.note}</span>
                                </div>
                              ))}
                            {updates.filter((u) => u.projectId === p.id).length ===
                              0 && (
                              <div className="text-sm text-zinc-500 italic">
                                No updates logged
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProject(p);
                            }}
                            className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center gap-1"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(p.id);
                            }}
                            className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      })()}
    </div>
  );
}
