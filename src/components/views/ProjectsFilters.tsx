"use client";

/**
 * ProjectsFilters — barra de filtros de ProjectsView: chips de estado/categoría/
 * prioridad + selector de orden (desktop) y los dos triggers de bottom-sheet
 * (mobile). Extraído de ProjectsView (ver AUDITORIA_CODIGO.md); JSX verbatim, el
 * estado de filtro y sus setters llegan como props.
 */

import type { Dispatch, SetStateAction } from "react";
import { ListFilter, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, Priority, ProjectStatus } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import { STATUS_FILTER_ORDER, statusConfig } from "@/lib/status";
import {
  PRIORITY_FILTER_ORDER,
  PROJECT_SORT_MODES,
  priorityChipClass,
  type ProjectSortMode,
} from "@/lib/priority";

interface ProjectsFiltersProps {
  projectStatusFilter: "all" | ProjectStatus;
  setProjectStatusFilter: Dispatch<SetStateAction<"all" | ProjectStatus>>;
  projectCategoryFilter: string | null;
  setProjectCategoryFilter: Dispatch<SetStateAction<string | null>>;
  projectPriorityFilter: "all" | Priority;
  setProjectPriorityFilter: Dispatch<SetStateAction<"all" | Priority>>;
  projectSortMode: ProjectSortMode;
  setProjectSortMode: Dispatch<SetStateAction<ProjectSortMode>>;
  categories: Category[];
  projectStatusCounts: Record<string, number>;
  projectPriorityCounts: Record<string, number>;
  activeFilterCount: number;
  setShowFilterSheet: Dispatch<SetStateAction<boolean>>;
  setShowSortSheet: Dispatch<SetStateAction<boolean>>;
}

export function ProjectsFilters({
  projectStatusFilter,
  setProjectStatusFilter,
  projectCategoryFilter,
  setProjectCategoryFilter,
  projectPriorityFilter,
  setProjectPriorityFilter,
  projectSortMode,
  setProjectSortMode,
  categories,
  projectStatusCounts,
  projectPriorityCounts,
  activeFilterCount,
  setShowFilterSheet,
  setShowSortSheet,
}: ProjectsFiltersProps) {
  const t = useTranslations("views.projects");
  const tStatus = useTranslations("status");
  const tPriority = useTranslations("priority");
  return (
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
                      : tPriority(pr);
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
  );
}
