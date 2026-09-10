"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type {
  Activity,
  Category,
  Priority,
  Project,
  ProjectNote,
  ProjectStatus,
  Task,
} from "@/lib/types";
import { statusConfig } from "@/lib/status";
import { projectIsBlocked } from "@/lib/cooling";
import { NotesSection } from "@/components/projects/notes/NotesSection";
import { ProjectClosureNotes } from "@/components/projects/ProjectClosureNotes";
import { ProjectTaskRow } from "@/components/projects/ProjectTaskRow";
import { ShowMoreList } from "@/components/ui/ShowMoreList";
import { InlineText, InlineTextarea } from "@/components/projects/InlineEdit";
import { Spine, spineStrikesTitle } from "@/components/ui/Spine";
import { Meta } from "@/components/ui/Meta";
import { UpdateComposer } from "./UpdateComposer";
import { ProjectLogbook } from "./ProjectLogbook";
import { BlockerPanel } from "./BlockerPanel";
import { ProjectStatusRail } from "./ProjectStatusRail";
import {
  CategorySelect,
  DueDateSelect,
  PrioritySelect,
  StatusSelect,
} from "./detailSelects";

type Tab = "logbook" | "tasks" | "notes";

/**
 * El detalle de proyecto: **el contenido, sin el chasis**.
 *
 * Vive separado de `ProjectDetailModal` a propósito. Hoy el detalle es un modal;
 * el rediseño lo quiere como pantalla con ruta propia, y eso depende del chasis
 * de navegación (ola 4). Teniendo el contenido aparte, ese día la migración es
 * envolver este componente en una página — no reescribirlo.
 *
 * Reorganización respecto al modal viejo (artboard 03):
 *
 * - **Migas** arriba: proyectos / categoría / nombre, para saber dónde estás.
 * - **"Por qué existe"** sube: es lo que reengancha, no la descripción.
 * - **Los bloqueos van por encima de la bitácora.** Si algo está detenido, es lo
 *   único que hace falta leer para saber qué hacer.
 * - **Pestañas** bitácora / tareas / notas en vez de seis secciones apiladas.
 *   Llevan su conteo para que nada parezca perdido.
 * - **Columna de estado** al lado: progreso, días sin tocar, días de vida,
 *   siguiente paso y descripción.
 *
 * Lo que el artboard pide y **no** está, porque no existe en el modelo: la
 * pestaña "archivos" (no hay adjuntos), el "cerró 2 tareas" bajo un update
 * (habría que inventar la relación por ventana temporal) y "blocker resuelto 11
 * días después" (los blockers se borran al resolverse).
 */
export function ProjectDetailPanel({
  project: p,
  tasks,
  activities,
  notes,
  categories,
  categoryById,
  onClose,
  onSaveProject,
  onDeleteProject,
  onAddTaskToProject,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: {
  project: Project;
  tasks: Task[];
  activities: Activity[];
  notes: ProjectNote[];
  categories: Category[];
  categoryById: Record<string, Category>;
  /** Opcional: como pantalla con ruta propia no habrá nada que cerrar. */
  onClose?: () => void;
  onSaveProject: (patch: Partial<Project>) => void | Promise<void>;
  onDeleteProject: (id: string) => void | Promise<void>;
  onAddTaskToProject: (projectId: string) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void | Promise<void>;
}) {
  const tCard = useTranslations("views.projects.card");
  const tDetail = useTranslations("views.projects.detail");
  const tProjects = useTranslations("views.projects");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tPriority = useTranslations("priority");
  const tProjectModal = useTranslations("modals.project");
  const locale = useLocale();

  const [tab, setTab] = useState<Tab>("logbook");

  const projectTasks = tasks.filter((t) => t.projectId === p.id);
  const projectUpdates = activities.filter(
    (a) => a.kind === "note" && a.projectId === p.id
  );
  const pendingTasks = projectTasks.filter((t) => !t.done);
  const doneTasks = projectTasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const blockedTasks = pendingTasks.filter((t) => (t.blockers?.length ?? 0) > 0);
  const blocked = projectIsBlocked(p, blockedTasks.length);
  const category = p.categoryId ? categoryById[p.categoryId] : undefined;
  const StatusIcon = statusConfig[p.status]?.icon;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "logbook", label: tDetail("tabLogbook"), count: projectUpdates.length },
    { id: "tasks", label: tDetail("tabTasks"), count: projectTasks.length },
    { id: "notes", label: tDetail("tabNotes"), count: notes.length },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ---------- Cabecera ---------- */}
      <header className="relative shrink-0 border-b border-border px-5 sm:px-6 py-4">
        <Spine status={p.status} priority={p.priority} blocked={blocked} />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Meta variant="cintillo" tone="faint" className="block">
              {tProjects("title")}
              {category ? ` / ${category.name}` : ""}
            </Meta>

            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <PrioritySelect
                value={p.priority}
                onChange={(priority: Priority) => onSaveProject({ priority })}
                tPriority={tPriority}
              />
              <InlineText
                value={p.name}
                onSave={(name) => onSaveProject({ name: name.trim() || p.name })}
                ariaLabel={tProjectModal("name")}
                className={`font-display-app text-xl sm:text-2xl text-text truncate px-2 py-0.5 -mx-2 ${
                  spineStrikesTitle(p.status) ? "line-through" : ""
                }`}
                inputClassName="font-display-app text-xl sm:text-2xl text-text px-2 py-0.5 w-full max-w-md"
              />
              <StatusSelect
                value={p.status}
                onChange={(status: ProjectStatus) => onSaveProject({ status })}
                tStatus={tStatus}
                StatusIcon={StatusIcon}
              />
              <CategorySelect
                value={p.categoryId}
                categories={categories}
                onChange={(categoryId: string | null) =>
                  onSaveProject({ categoryId })
                }
                categoryById={categoryById}
                tProjectModal={tProjectModal}
              />
              <DueDateSelect
                value={p.dueDate}
                onChange={(dueDate: string | null) => onSaveProject({ dueDate })}
                locale={locale}
                label={tDetail("dueDate")}
                emptyLabel={tDetail("noDueDate")}
                clearLabel={tDetail("clearDueDate")}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={async () => {
                await onDeleteProject(p.id);
                onClose?.();
              }}
              className="px-3 py-1.5 text-xs bg-signal-a12 hover:bg-signal-a16 text-signal rounded-md flex items-center gap-1 transition-colors duration-150 ease-out"
            >
              <Trash2 size={12} /> {tCommon("delete")}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text p-1.5 rounded-md hover:bg-surface ml-1 transition-colors duration-150 ease-out"
                aria-label={tCommon("close")}
                title={tDetail("closeTooltip")}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------- Cuerpo ---------- */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* --- Columna principal --- */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* "Por qué existe" arriba: es lo que reengancha. */}
            <div>
              <Meta variant="cintillo" tone="faint" className="block mb-1">
                {tCard("whyMatters")}
              </Meta>
              <InlineTextarea
                value={p.why}
                onSave={(why) => onSaveProject({ why })}
                placeholder={tCard("whyEmpty")}
                ariaLabel={tCard("whyMatters")}
                className="text-[15px] leading-[1.6] text-text-2 px-1.5 py-1 -mx-1.5 block min-h-[1.5rem] max-w-[68ch]"
                textareaClassName="text-[15px] leading-[1.6] text-text"
                rows={3}
              />
            </div>

            <BlockerPanel blockedTasks={blockedTasks} onOpenTask={onEditTask} />

            {(p.status === "paused" || p.status === "killed") && (
              <div
                className={`rounded-lg border px-3 py-3 ${
                  p.status === "killed"
                    ? "border-signal-a50 bg-signal-a12"
                    : "border-line-22 bg-line-08"
                }`}
              >
                <ProjectClosureNotes project={p} />
              </div>
            )}

            {/* --- Pestañas --- */}
            <div className="flex items-center gap-1 border-b border-line-08">
              {TABS.map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTab(tb.id)}
                  aria-current={tab === tb.id}
                  className={`px-3 py-2 -mb-px border-b-2 transition-colors duration-150 ease-out ${
                    tab === tb.id
                      ? "border-accent text-text"
                      : "border-transparent text-text-4 hover:text-text-2"
                  }`}
                >
                  <Meta variant="cintillo" tone="inherit">
                    {tb.label}
                    {tb.count > 0 ? ` · ${tb.count}` : ""}
                  </Meta>
                </button>
              ))}
            </div>

            {tab === "logbook" && (
              <div className="space-y-4">
                <UpdateComposer projectId={p.id} />
                <ProjectLogbook updates={projectUpdates} />
              </div>
            )}

            {tab === "tasks" && (
              <div className="space-y-1">
                <button
                  onClick={() => onAddTaskToProject(p.id)}
                  className="text-xs text-accent hover:text-accent-hi flex items-center gap-1 mb-2 transition-colors duration-150 ease-out"
                >
                  <Plus size={12} /> {tCard("addTask")}
                </button>
                {projectTasks.length === 0 ? (
                  <Meta tone="faint">{tCard("noTasks")}</Meta>
                ) : (
                  <>
                    {pendingTasks.map((task) => (
                      <ProjectTaskRow
                        key={task.id}
                        task={task}
                        onToggleTask={onToggleTask}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                      />
                    ))}
                    <ShowMoreList
                      items={doneTasks}
                      initialCount={5}
                      renderItem={(task) => (
                        <ProjectTaskRow
                          key={task.id}
                          task={task}
                          onToggleTask={onToggleTask}
                          onEditTask={onEditTask}
                          onDeleteTask={onDeleteTask}
                        />
                      )}
                      itemKey={(task) => task.id}
                    />
                  </>
                )}
              </div>
            )}

            {tab === "notes" && <NotesSection projectId={p.id} notes={notes} />}
          </div>

          {/* --- Columna de estado --- */}
          <div className="lg:w-64 shrink-0 mt-6 lg:mt-0 space-y-5">
            <ProjectStatusRail project={p} tasks={projectTasks} />

            <div>
              <Meta variant="cintillo" tone="faint" className="block mb-1">
                {tCard("nextStep")}
              </Meta>
              <InlineText
                value={p.nextStep}
                onSave={(nextStep) => onSaveProject({ nextStep })}
                placeholder={tCard("nextStepEmpty")}
                ariaLabel={tCard("nextStep")}
                className="text-sm text-text w-full px-1.5 py-1 -mx-1.5 block"
                inputClassName="text-sm text-text w-full px-1.5 py-1"
              />
            </div>

            <div>
              <Meta variant="cintillo" tone="faint" className="block mb-1">
                {tCard("description")}
              </Meta>
              <InlineTextarea
                value={p.description}
                onSave={(description) => onSaveProject({ description })}
                placeholder={tCard("descriptionEmpty")}
                ariaLabel={tCard("description")}
                className="text-sm text-text-3 px-1.5 py-1 -mx-1.5 block min-h-[1.5rem]"
                textareaClassName="text-sm text-text"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
