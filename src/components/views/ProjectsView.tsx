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
  Plus,
  Search,
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
import { toLocalISO } from "@/lib/date";
import { type ProjectSortMode } from "@/lib/priority";
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
import { ProjectsFilters } from "./ProjectsFilters";

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
  const tCommon = useTranslations("common");
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
        <ProjectsFilters
          projectStatusFilter={projectStatusFilter}
          setProjectStatusFilter={setProjectStatusFilter}
          projectCategoryFilter={projectCategoryFilter}
          setProjectCategoryFilter={setProjectCategoryFilter}
          projectPriorityFilter={projectPriorityFilter}
          setProjectPriorityFilter={setProjectPriorityFilter}
          projectSortMode={projectSortMode}
          setProjectSortMode={setProjectSortMode}
          categories={categories}
          projectStatusCounts={projectStatusCounts}
          projectPriorityCounts={projectPriorityCounts}
          activeFilterCount={activeFilterCount}
          setShowFilterSheet={setShowFilterSheet}
          setShowSortSheet={setShowSortSheet}
        />
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

