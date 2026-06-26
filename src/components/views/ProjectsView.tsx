"use client";

/**
 * ProjectsView — lista principal de proyectos con búsqueda, filtros (estado,
 * categoría, prioridad, vencimiento) y varios modos de orden, incluido "Mi orden"
 * (manual) con drag & drop persistido en `Project.position`.
 * Cada fila es expandible in situ y muestra el detalle del proyecto: tareas
 * (pendientes/hechas), log de updates y notas, sin abrir el modal completo.
 */

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowDownUp,
  GripVertical,
  ListFilter,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { categoryColorClass } from "@/lib/types";
import { toLocalISO } from "@/lib/date";
import { STATUS_FILTER_ORDER, statusConfig } from "@/lib/status";
import {
  PRIORITY_FILTER_ORDER,
  PROJECT_SORT_MODES,
  priorityChipClass,
  type ProjectSortMode,
} from "@/lib/priority";
import { FAB } from "@/components/ui/FAB";
import {
  EMPTY_FILTER,
  ProjectsFilterSheet,
  type DueFilter,
  type ProjectFilterDraft,
} from "./ProjectsFilterSheet";
import { ProjectsSortSheet } from "./ProjectsSortSheet";
import { useStableLayout, type LayoutEntry } from "@/lib/useStableLayout";
import {
  compareProjects,
  matchesCategory,
  matchesDue,
  matchesPriority,
  matchesSearch as matchesSearchProject,
  matchesStatus,
  smartSectionOf as smartSectionOfProject,
} from "./projectSort";
import { ProjectRow } from "./ProjectRow";

/**
 * Vista de lista de proyectos. Mantiene en estado local el término de búsqueda,
 * los cuatro filtros y el modo de orden; el detalle expandido se controla desde
 * fuera vía `selectedProject`/`onSelectProject` para que sea compartible con otras
 * vistas (deep links, saltos desde TodayView). Las mutaciones (crear/editar/borrar
 * proyecto y tarea, log de update, reordenar) se delegan por callbacks.
 */
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
  onReorderProjects,
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
  onReorderProjects: (orderedIds: string[]) => void | Promise<unknown>;
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
  >("all");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<string | null>(
    null
  );
  const [projectPriorityFilter, setProjectPriorityFilter] = useState<
    "all" | Priority
  >("all");
  const [projectSortMode, setProjectSortMode] =
    useState<ProjectSortMode>("manual");
  const [projectDueFilter, setProjectDueFilter] = useState<DueFilter>("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  const horizonISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toLocalISO(d);
  }, []);

  // Predicados de filtro reutilizables: la misma lógica alimenta el listado real
  // (`filtered`), la previsualización de conteo del sheet (`previewCount`) y el
  // efecto que revela un proyecto seleccionado oculto. Reciben el valor del filtro
  // por parámetro (sufijo `With`) para poder evaluar drafts sin tocar el estado.

  // Wrappers finos que enlazan la lógica pura (./projectSort) con el closure del
  // componente (horizonISO). Las firmas coinciden, así que los call sites no cambian.
  const matchesDueWith = (p: Project, due: DueFilter) =>
    matchesDue(p, due, horizonISO);
  const matchesStatusWith = matchesStatus;
  const matchesPriorityWith = matchesPriority;
  const matchesCategoryWith = matchesCategory;

  /** Conteo en vivo que muestra el sheet de filtros mientras el usuario edita un
   *  draft, sin aplicarlo todavía (la búsqueda no entra: el sheet no la edita). */
  const previewCount = (draft: ProjectFilterDraft) =>
    projects.filter(
      (p) =>
        matchesStatusWith(p, draft.status) &&
        matchesPriorityWith(p, draft.priority) &&
        matchesCategoryWith(p, draft.categoryId) &&
        matchesDueWith(p, draft.due)
    ).length;

  // Safety net for deep links / cross-view jumps: if a project gets selected
  // (e.g. from TodayView via onJumpToProject) but the current filters would
  // hide it, reset filters so the user actually sees what they navigated to.
  useEffect(() => {
    if (!selectedProject) return;
    const visible =
      matchesStatusWith(selectedProject, projectStatusFilter) &&
      matchesPriorityWith(selectedProject, projectPriorityFilter) &&
      matchesCategoryWith(selectedProject, projectCategoryFilter) &&
      matchesDueWith(selectedProject, projectDueFilter);
    if (!visible) {
      setProjectStatusFilter("all");
      setProjectPriorityFilter("all");
      setProjectCategoryFilter(null);
      setProjectDueFilter("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id]);

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
      killed: 0,
      archived: 0,
    };
    for (const p of projects) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
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

  // ----- Sorting + stable layout (A/B/C/D) -----
  // Hooks must run unconditionally, so all the sort/layout math lives here at
  // the top level (not inside the render IIFE below).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const q = projectSearch.trim().toLowerCase();
  const matchesSearch = (p: Project) => matchesSearchProject(p, q, categoryById);

  const filtered = projects.filter(
    (p) =>
      matchesSearch(p) &&
      matchesStatusWith(p, projectStatusFilter) &&
      matchesCategoryWith(p, projectCategoryFilter) &&
      matchesPriorityWith(p, projectPriorityFilter) &&
      matchesDueWith(p, projectDueFilter)
  );

  const compare = (a: Project, b: Project) =>
    compareProjects(a, b, { sortMode: projectSortMode, locale, tasks });

  // (C) Smart splits into sections; other modes are a single flat list.
  const smartSectionOf = (p: Project) => smartSectionOfProject(p, tasks);

  const sorted = [...filtered].sort(compare);
  const ideal: LayoutEntry[] = sorted.map((p) => ({
    id: p.id,
    section: projectSortMode === "smart" ? smartSectionOf(p) : null,
  }));
  const liveIds = new Set(filtered.map((p) => p.id));
  const layoutSignature = [
    projectSortMode,
    projectStatusFilter,
    projectPriorityFilter,
    projectCategoryFilter,
    projectDueFilter,
    q,
  ].join("|");
  const { entries, isStale, resync } = useStableLayout(
    ideal,
    liveIds,
    layoutSignature
  );

  const projectById = useMemo(() => {
    const m = new Map<string, Project>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  // (D) Manual drag is only enabled with no narrowing filters/search active —
  // reordering a partial list has no unambiguous global meaning.
  const manualDragEnabled =
    projectSortMode === "manual" &&
    !q &&
    projectStatusFilter === "all" &&
    projectPriorityFilter === "all" &&
    projectCategoryFilter === null &&
    projectDueFilter === "all";

  const onManualDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sorted.map((p) => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    void onReorderProjects(arrayMove(ids, oldIndex, newIndex));
  };

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
        if (filtered.length === 0) {
          const reason = q
            ? t("noMatchSearch", { query: projectSearch })
            : t("noMatchFilters");
          const filtersAreNarrowing = activeFilterCount > 0 && !q;
          return (
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-sm">
              <p className="text-text-muted mb-3">{reason}</p>
              {filtersAreNarrowing && (
                <button
                  onClick={() => {
                    setProjectStatusFilter("all");
                    setProjectPriorityFilter("all");
                    setProjectCategoryFilter(null);
                    setProjectDueFilter("all");
                  }}
                  className="text-xs px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-md"
                >
                  {t("clearFilters")}
                </button>
              )}
            </div>
          );
        }

        // TODO: refactor — extraer renderRow (368 líneas, 8 niveles) a ProjectRow/ProjectRowExpanded + TaskRow compartido con ProjectDetailModal (ver AUDITORIA_CODIGO.md)
        /**
         * Construye una fila de proyecto: la cabecera siempre visible (estado,
         * nombre, badges derivados, progreso) y, si está seleccionada, el bloque
         * de detalle expandido (next step, why, descripción, tareas, updates,
         * notas y acciones). Recibe `dragHandle` opcional que el modo manual
         * inyecta para arrastrar. Los contadores y badges se derivan aquí por fila
         * a partir de `tasks`/`activities`, no se memoizan (lista corta esperada).
         */
        const renderRow = (p: Project, dragHandle?: ReactNode) => (
          <ProjectRow
            key={p.id}
            project={p}
            dragHandle={dragHandle}
            tasks={tasks}
            activities={activities}
            notesByProject={notesByProject}
            selectedProject={selectedProject}
            categoryById={categoryById}
            onSelectProject={onSelectProject}
            onOpenProject={onOpenProject}
            onAddTaskToProject={onAddTaskToProject}
            onLogUpdate={onLogUpdate}
            onToggleTask={onToggleTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onEditProject={onEditProject}
            onDeleteProject={onDeleteProject}
          />
        );

        // (D) Manual order: drag to reorder (only when no filters narrow it).
        if (projectSortMode === "manual") {
          return (
            <ManualProjectList
              order={sorted}
              dragEnabled={manualDragEnabled}
              sensors={sensors}
              onDragEnd={onManualDragEnd}
              renderRow={renderRow}
              hint={manualDragEnabled ? t("manualHint") : t("manualFilteredHint")}
            />
          );
        }

        // (A/C) Frozen layout, grouped into sections for Smart.
        // Recorre el orden congelado (`entries`, de useStableLayout) en vez de
        // `sorted` para no reordenar mientras el usuario edita; en Smart inserta
        // un SectionHeader cada vez que cambia la sección de urgencia.
        const rows: ReactNode[] = [];
        let currentSection: string | null = null;
        for (const entry of entries) {
          const p = projectById.get(entry.id);
          if (!p) continue;
          if (projectSortMode === "smart" && entry.section !== currentSection) {
            currentSection = entry.section;
            rows.push(
              <SectionHeader
                key={`sec-${entry.section}`}
                label={t(`sections.${entry.section}`)}
              />
            );
          }
          rows.push(renderRow(p));
        }

        return (
          <div className="space-y-2">
            {isStale && (
              <ReorderPill
                label={t("orderChanged")}
                cta={t("reorder")}
                onClick={resync}
              />
            )}
            <div className="flex flex-col divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
              {rows}
            </div>
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

/** Section divider for Smart mode ("Necesitan atención" / "En riesgo" / "Resto"). */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="bg-surface/60 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
      {label}
    </div>
  );
}

/** Opt-in re-sort banner (A): shown when an edit made the live order diverge
 *  from the frozen one, so the user reorders on demand instead of mid-edit. */
function ReorderPill({
  label,
  cta,
  onClick,
}: {
  label: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
      <span className="text-text-muted">{label}</span>
      <button
        onClick={onClick}
        className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30"
      >
        <ArrowDownUp size={12} /> {cta}
      </button>
    </div>
  );
}

/** One draggable row in manual mode (D). Wraps the shared row renderer and
 *  injects a grip handle wired to dnd-kit's sortable listeners. */
function SortableProjectRow({
  project,
  renderRow,
  disabled,
  reorderLabel,
}: {
  project: Project;
  renderRow: (p: Project, dragHandle?: ReactNode) => ReactNode;
  disabled: boolean;
  reorderLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
  };
  const handle = disabled ? null : (
    <button
      type="button"
      aria-label={reorderLabel}
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 -ml-1 text-text-muted hover:text-text cursor-grab active:cursor-grabbing touch-none"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style}>
      {renderRow(project, handle)}
    </div>
  );
}

/** Manual-order list (D): drag-to-reorder when no filters narrow the set,
 *  otherwise a read-only hint explaining why dragging is off. */
function ManualProjectList({
  order,
  dragEnabled,
  sensors,
  onDragEnd,
  renderRow,
  hint,
}: {
  order: Project[];
  dragEnabled: boolean;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  renderRow: (p: Project, dragHandle?: ReactNode) => ReactNode;
  hint: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-text-muted px-1">
        <ArrowDownUp size={12} />
        <span>{hint}</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={order.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
            {order.map((p) => (
              <SortableProjectRow
                key={p.id}
                project={p}
                renderRow={renderRow}
                disabled={!dragEnabled}
                reorderLabel={hint}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

