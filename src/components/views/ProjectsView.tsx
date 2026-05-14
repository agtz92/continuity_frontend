"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  ListFilter,
  Maximize2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  Activity as ActivityEntry,
  Category,
  Priority,
  Project,
  ProjectNote,
  ProjectStatus,
  Task,
} from "@/lib/types";
import { NotesSection } from "@/components/projects/notes/NotesSection";
import { ProjectSection } from "@/components/projects/ProjectSection";
import {
  categoryColorClass,
  priorityMeta,
  priorityRank,
} from "@/lib/types";
import {
  daysSince,
  dueDateOnly,
  isDueToday,
  isOverdue,
  toLocalISO,
  todayLocalISODate,
} from "@/lib/date";
import { STATUS_FILTER_ORDER, statusConfig } from "@/lib/status";
import {
  PRIORITY_FILTER_ORDER,
  PROJECT_SORT_MODES,
  priorityChipClass,
  priorityStripeClass,
  type ProjectSortMode,
} from "@/lib/priority";
import { FAB } from "@/components/ui/FAB";
import { ShowMoreList } from "@/components/ui/ShowMoreList";
import {
  EMPTY_FILTER,
  ProjectsFilterSheet,
  type DueFilter,
  type ProjectFilterDraft,
} from "./ProjectsFilterSheet";
import { ProjectsSortSheet } from "./ProjectsSortSheet";

export function ProjectsView({
  projects,
  tasks,
  activities,
  categories,
  categoryById,
  notesByProject,
  selectedProject,
  onSelectProject,
  onNewProject,
  onEditProject,
  onDeleteProject,
  onOpenProject,
  onAddTaskToProject,
  onLogUpdate,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: {
  projects: Project[];
  tasks: Task[];
  activities: ActivityEntry[];
  categories: Category[];
  categoryById: Record<string, Category>;
  notesByProject: Record<string, ProjectNote[]>;
  selectedProject: Project | null;
  onSelectProject: (p: Project | null) => void;
  onNewProject: () => void;
  onEditProject: (p: Project) => void;
  onDeleteProject: (id: string) => void | Promise<void>;
  onOpenProject: (p: Project) => void;
  onAddTaskToProject: (projectId: string) => void;
  onLogUpdate: (p: Project) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.projects");
  const tCard = useTranslations("views.projects.card");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tPriority = useTranslations("priority");
  const locale = useLocale();
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<
    "all" | ProjectStatus
  >("active");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<string | null>(
    null
  );
  const [projectPriorityFilter, setProjectPriorityFilter] = useState<
    "all" | Priority
  >("all");
  const [projectSortMode, setProjectSortMode] =
    useState<ProjectSortMode>("smart");
  const [projectDueFilter, setProjectDueFilter] = useState<DueFilter>("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  const horizonISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toLocalISO(d);
  }, []);

  const matchesDueWith = (p: Project, due: DueFilter) => {
    if (due === "all") return true;
    if (due === "none") return !p.dueDate;
    if (!p.dueDate) return false;
    const dueIso = dueDateOnly(p.dueDate);
    const today = todayLocalISODate();
    if (due === "overdue") return dueIso < today;
    return dueIso >= today && dueIso <= horizonISO;
  };

  const matchesStatusWith = (p: Project, status: "all" | ProjectStatus) => {
    if (status === "all") return true;
    if (status === "stalled") {
      if (p.status === "stalled") return true;
      const idle = daysSince(p.lastActivity) ?? 0;
      return ["active", "idea"].includes(p.status) && idle >= 7;
    }
    return p.status === status;
  };

  const matchesPriorityWith = (p: Project, priority: "all" | Priority) =>
    priority === "all" || p.priority === priority;

  const matchesCategoryWith = (p: Project, categoryId: string | null) =>
    categoryId === null || p.categoryId === categoryId;

  const previewCount = (draft: ProjectFilterDraft) =>
    projects.filter(
      (p) =>
        matchesStatusWith(p, draft.status) &&
        matchesPriorityWith(p, draft.priority) &&
        matchesCategoryWith(p, draft.categoryId) &&
        matchesDueWith(p, draft.due)
    ).length;

  const filterDraft: ProjectFilterDraft = {
    status: projectStatusFilter,
    priority: projectPriorityFilter,
    categoryId: projectCategoryFilter,
    due: projectDueFilter,
  };

  const activeFilterCount =
    (projectStatusFilter !== "all" ? 1 : 0) +
    (projectPriorityFilter !== "all" ? 1 : 0) +
    (projectCategoryFilter !== null ? 1 : 0) +
    (projectDueFilter !== "all" ? 1 : 0);

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

  const projectPriorityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: projects.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const p of projects) {
      counts[p.priority] = (counts[p.priority] ?? 0) + 1;
    }
    return counts;
  }, [projects]);

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
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-text-muted"
            />
          </div>
          <button
            onClick={onNewProject}
            className="px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm hidden md:flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> {tCommon("new")}
          </button>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="mb-4 md:bg-surface/40 md:border md:border-border/60 md:rounded-xl md:p-3">
          {/* Mobile: two buttons opening sheets */}
          <div className="flex gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setShowFilterSheet(true)}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text flex items-center justify-center gap-2"
            >
              <ListFilter size={16} />
              <span>{t("filterCta")}</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-bg text-[11px] font-semibold tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowSortSheet(true)}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={16} />
              <span>{t(`sortBy.${projectSortMode}`)}</span>
            </button>
          </div>

          {/* Desktop: labeled rows */}
          <div className="hidden md:flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <span className="text-[11px] uppercase tracking-wider text-text-muted w-20 shrink-0 mt-1.5">
                {t("filterLabel.status")}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {STATUS_FILTER_ORDER.map((s) => {
                  const isActive = projectStatusFilter === s;
                  const count = projectStatusCounts[s] ?? 0;
                  if (s !== "all" && count === 0) return null;
                  const cfg =
                    s === "all" ? null : statusConfig[s as ProjectStatus];
                  const label = s === "all" ? tStatus("all") : tStatus(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setProjectStatusFilter(s)}
                      aria-pressed={isActive}
                      className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${
                        isActive
                          ? s === "all"
                            ? "bg-text/10 border-text/30 text-text"
                            : `${cfg?.color} ring-1 ring-current/40`
                          : "bg-surface border-border text-text-muted hover:text-text hover:border-border"
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`text-[10px] px-1.5 rounded-full ${
                          isActive ? "bg-black/30" : "bg-border text-text-muted"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {categories.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] uppercase tracking-wider text-text-muted w-20 shrink-0 mt-1.5">
                  {t("filterLabel.category")}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  <button
                    onClick={() => setProjectCategoryFilter(null)}
                    aria-pressed={projectCategoryFilter === null}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      projectCategoryFilter === null
                        ? "bg-text/10 border-text/30 text-text"
                        : "bg-surface border-border text-text-muted hover:text-text hover:border-border"
                    }`}
                  >
                    {t("allCategories")}
                  </button>
                  {categories.map((c) => {
                    const isActive = projectCategoryFilter === c.id;
                    const cls = categoryColorClass(c.color);
                    return (
                      <button
                        key={c.id}
                        onClick={() =>
                          setProjectCategoryFilter(isActive ? null : c.id)
                        }
                        aria-pressed={isActive}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                          isActive
                            ? `${cls.chip} ring-1 ring-current/40`
                            : "bg-surface border-border text-text-muted hover:text-text hover:border-border"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cls.dot}`} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="text-[11px] uppercase tracking-wider text-text-muted w-20 shrink-0 mt-1.5">
                {t("filterLabel.priority")}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {PRIORITY_FILTER_ORDER.map((pr) => {
                  const isActive = projectPriorityFilter === pr;
                  const count = projectPriorityCounts[pr] ?? 0;
                  if (pr !== "all" && count === 0) return null;
                  const label =
                    pr === "all"
                      ? t("allPriorities")
                      : `${priorityMeta(pr).emoji} ${tPriority(pr)}`;
                  return (
                    <button
                      key={pr}
                      onClick={() => setProjectPriorityFilter(pr)}
                      aria-pressed={isActive}
                      className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${
                        isActive
                          ? pr === "all"
                            ? "bg-text/10 border-text/30 text-text"
                            : `${priorityChipClass[pr]} ring-1 ring-current/40`
                          : "bg-surface border-border text-text-muted hover:text-text hover:border-border"
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`text-[10px] px-1.5 rounded-full ${
                          isActive ? "bg-black/30" : "bg-border text-text-muted"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-border/60">
              <span className="text-[11px] uppercase tracking-wider text-text-muted w-20 shrink-0 mt-1.5">
                {t("filterLabel.sort")}
              </span>
              <select
                value={projectSortMode}
                onChange={(e) =>
                  setProjectSortMode(e.target.value as ProjectSortMode)
                }
                className="mt-1 bg-surface border border-border rounded-md px-2 py-1 text-xs text-text hover:border-border focus:outline-none focus:ring-1 focus:ring-accent/40"
                aria-label={t("sortAria")}
              >
                {PROJECT_SORT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {t(`sortBy.${m}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted mb-4">{t("empty")}</p>
          <button
            onClick={onNewProject}
            className="px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm"
          >
            {t("addFirst")}
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

        const matchesPriority = (p: Project) =>
          projectPriorityFilter === "all" ||
          p.priority === projectPriorityFilter;

        const filtered = projects.filter(
          (p) =>
            matchesSearch(p) &&
            matchesStatus(p) &&
            matchesCategory(p) &&
            matchesPriority(p) &&
            matchesDueWith(p, projectDueFilter)
        );

        if (filtered.length === 0) {
          const reason = q
            ? t("noMatchSearch", { query: projectSearch })
            : t("noMatchFilters");
          return (
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
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

        const recentTs = (p: Project) =>
          new Date(p.lastActivity).getTime();

        const compare = (a: Project, b: Project) => {
          switch (projectSortMode) {
            case "priority": {
              const d = priorityRank(a.priority) - priorityRank(b.priority);
              return d !== 0 ? d : recentTs(b) - recentTs(a);
            }
            case "recent":
              return recentTs(b) - recentTs(a);
            case "name":
              return a.name.localeCompare(b.name, locale);
            case "status": {
              const sa = STATUS_FILTER_ORDER.indexOf(a.status);
              const sb = STATUS_FILTER_ORDER.indexOf(b.status);
              if (sa !== sb) return sa - sb;
              const pd = priorityRank(a.priority) - priorityRank(b.priority);
              return pd !== 0 ? pd : recentTs(b) - recentTs(a);
            }
            case "smart":
            default: {
              const ba = urgencyBucket(a);
              const bb = urgencyBucket(b);
              if (ba !== bb) return ba - bb;
              const pd = priorityRank(a.priority) - priorityRank(b.priority);
              if (pd !== 0) return pd;
              return recentTs(b) - recentTs(a);
            }
          }
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 auto-rows-min">
            {[...filtered]
              .sort(compare)
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
                const StatusIcon = statusConfig[p.status]?.icon ?? Activity;
                const days = daysSince(p.lastActivity) ?? 0;
                const isStalled =
                  ["active", "idea"].includes(p.status) && days >= 7;
                const isExpanded = selectedProject?.id === p.id;

                return (
                  <div
                    key={p.id}
                    className={`relative bg-surface border rounded-xl overflow-hidden transition-all ${
                      isStalled ? "border-amber-500/40" : "border-border"
                    } ${isExpanded ? "ring-1 ring-accent/30 lg:col-span-2" : ""}`}
                  >
                    <div
                      aria-hidden
                      className={`absolute left-0 top-0 bottom-0 w-1 ${priorityStripeClass[p.priority]}`}
                      title={tPriority(p.priority)}
                    />
                    <div
                      className="p-4 cursor-pointer hover:bg-surface/50"
                      onClick={() => onSelectProject(isExpanded ? null : p)}
                    >
                      <div className="flex items-start gap-3">
                        <ChevronRight
                          size={18}
                          className={`shrink-0 mt-0.5 text-text-muted transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded border ${statusConfig[p.status]?.color}`}
                              title={tStatus(p.status)}
                              aria-label={tStatus(p.status)}
                            >
                              <StatusIcon size={12} />
                            </span>
                            <span className="font-semibold">{p.name}</span>
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
                              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40">
                                {tCard("overdueBadge", { count: overdueCount })}
                              </span>
                            )}
                            {todayCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/40">
                                {tCard("todayBadge", { count: todayCount })}
                              </span>
                            )}
                            {isStalled && (
                              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                {tCard("idleBadge", { count: days })}
                              </span>
                            )}
                            {pendingEffort > 0 && (
                              <span
                                className="text-xs px-2 py-0.5 rounded bg-accent-2/15 text-accent-2 border border-accent-2/30 inline-flex items-center gap-1"
                                title={tCard("pendingHoursTooltip")}
                              >
                                <Clock size={10} />
                                {tCard("pendingHoursBadge", { hours: pendingEffort })}
                              </span>
                            )}
                          </div>
                          {p.nextStep && (
                            <div className="text-sm text-text-muted truncate">
                              → {p.nextStep}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-text-muted shrink-0">
                          {total > 0 && `${done}/${total}`}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (() => {
                      const projectNotes = activities.filter(
                        (a) => a.kind === "note" && a.projectId === p.id
                      );
                      return (
                      <div className="border-t border-border p-4 space-y-3">
                        <div className="flex justify-end -mt-1 -mr-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenProject(p);
                            }}
                            className="text-xs px-3 py-1.5 rounded-md bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Maximize2 size={12} />
                            {t("openFullView")}
                          </button>
                        </div>

                        {/* Next step — always shown, never collapsible */}
                        <div className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
                          <div className="text-xs uppercase tracking-wider text-accent mb-1">
                            {tCard("nextStep")}
                          </div>
                          {p.nextStep ? (
                            <div className="text-sm text-text">→ {p.nextStep}</div>
                          ) : (
                            <div className="text-sm text-text-muted italic">
                              {tCard("nextStepEmpty")}
                            </div>
                          )}
                        </div>

                        <ProjectSection title={tCard("whyMatters")}>
                          {p.why ? (
                            <div className="text-sm text-text-muted whitespace-pre-wrap">
                              {p.why}
                            </div>
                          ) : (
                            <div className="text-sm text-text-muted italic">
                              {tCard("whyEmpty")}
                            </div>
                          )}
                        </ProjectSection>

                        <ProjectSection title={tCard("description")}>
                          {p.description ? (
                            <div className="text-sm text-text-muted whitespace-pre-wrap">
                              {p.description}
                            </div>
                          ) : (
                            <div className="text-sm text-text-muted italic">
                              {tCard("descriptionEmpty")}
                            </div>
                          )}
                        </ProjectSection>

                        <ProjectSection
                          title={tCard("tasks")}
                          rightSlot={
                            total > 0 ? (
                              <span className="text-xs font-normal text-text-muted bg-border/80 border border-border rounded-full px-2 py-0.5 tabular-nums">
                                {done}/{total}
                              </span>
                            ) : null
                          }
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddTaskToProject(p.id);
                            }}
                            className="text-xs text-accent hover:text-accent flex items-center gap-1 mb-2"
                          >
                            <Plus size={12} /> {tCard("addTask")}
                          </button>
                          {projectTasks.length === 0 ? (
                            <div className="text-sm text-text-muted italic">
                              {tCard("noTasks")}
                            </div>
                          ) : (() => {
                            const pendingTasks = projectTasks.filter((tk) => !tk.done);
                            const doneTasks = projectTasks
                              .filter((tk) => tk.done)
                              .sort((a, b) =>
                                (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
                              );
                            const renderTaskRow = (task: Task) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 group py-1"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTask(task);
                                  }}
                                  className={`shrink-0 ${
                                    task.done
                                      ? "text-accent"
                                      : "text-text-muted hover:text-text-muted"
                                  }`}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <span
                                  className={`text-sm flex-1 ${
                                    task.done
                                      ? "line-through text-text-muted"
                                      : "text-text"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {task.dueDate && (
                                  <span className="text-xs text-text-muted">
                                    {new Date(task.dueDate).toLocaleDateString(locale)}
                                  </span>
                                )}
                                {task.effortHours != null && (
                                  <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
                                    <Clock size={10} />
                                    {task.effortHours}h
                                  </span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTask(task);
                                  }}
                                  className="text-text-muted hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                  aria-label={tCard("editTaskAria")}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTask(task.id);
                                  }}
                                  className="text-text-muted hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                  aria-label={tCard("deleteTaskAria")}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                            return (
                              <div className="space-y-1">
                                {pendingTasks.map(renderTaskRow)}
                                <ShowMoreList
                                  items={doneTasks}
                                  initialCount={5}
                                  renderItem={renderTaskRow}
                                  itemKey={(task) => task.id}
                                />
                              </div>
                            );
                          })()}
                        </ProjectSection>

                        <ProjectSection
                          title={tCard("recentActivity")}
                          rightSlot={
                            projectNotes.length > 0 ? (
                              <span className="text-xs font-normal text-text-muted bg-border/80 border border-border rounded-full px-2 py-0.5 tabular-nums">
                                {projectNotes.length}
                              </span>
                            ) : null
                          }
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLogUpdate(p);
                            }}
                            className="text-xs text-accent hover:text-accent flex items-center gap-1 mb-2"
                          >
                            <Plus size={12} /> {tCard("logUpdate")}
                          </button>
                          <div className="space-y-1">
                            {projectNotes.length === 0 ? (
                              <div className="text-sm text-text-muted italic">
                                {tCard("noUpdates")}
                              </div>
                            ) : (
                              <ShowMoreList
                                items={[...projectNotes].sort((a, b) =>
                                  (b.created ?? "").localeCompare(a.created ?? "")
                                )}
                                initialCount={5}
                                renderItem={(a) => (
                                  <div
                                    key={a.id}
                                    className="text-sm text-text-muted flex flex-col sm:flex-row gap-0.5 sm:gap-2"
                                  >
                                    <span className="text-text-muted text-xs shrink-0 sm:w-20">
                                      {new Date(a.created).toLocaleDateString(locale, {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                    <span className="break-words min-w-0">{a.note}</span>
                                  </div>
                                )}
                                itemKey={(a) => a.id}
                              />
                            )}
                          </div>
                        </ProjectSection>

                        <ProjectSection
                          title={tCard("notes")}
                          rightSlot={
                            (notesByProject[p.id]?.length ?? 0) > 0 ? (
                              <span className="text-xs font-normal text-text-muted bg-border/80 border border-border rounded-full px-2 py-0.5 tabular-nums">
                                {notesByProject[p.id]!.length}
                              </span>
                            ) : null
                          }
                        >
                          <NotesSection
                            projectId={p.id}
                            notes={notesByProject[p.id] ?? []}
                          />
                        </ProjectSection>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProject(p);
                            }}
                            className="px-3 py-1.5 text-xs bg-border hover:opacity-80 rounded-md flex items-center gap-1"
                          >
                            <Edit2 size={12} /> {tCommon("edit")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(p.id);
                            }}
                            className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md flex items-center gap-1"
                          >
                            <Trash2 size={12} /> {tCommon("delete")}
                          </button>
                        </div>
                      </div>
                      );
                    })()}
                  </div>
                );
              })}
          </div>
        );
      })()}

      <FAB
        icon={<Plus size={24} />}
        label={t("newAria")}
        onClick={onNewProject}
      />

      <ProjectsFilterSheet
        open={showFilterSheet}
        initial={filterDraft}
        categories={categories}
        previewCount={previewCount}
        onApply={(draft) => {
          setProjectStatusFilter(draft.status);
          setProjectPriorityFilter(draft.priority);
          setProjectCategoryFilter(draft.categoryId);
          setProjectDueFilter(draft.due);
        }}
        onClose={() => setShowFilterSheet(false)}
      />

      <ProjectsSortSheet
        open={showSortSheet}
        value={projectSortMode}
        onChange={setProjectSortMode}
        onClose={() => setShowSortSheet(false)}
      />
    </div>
  );
}

