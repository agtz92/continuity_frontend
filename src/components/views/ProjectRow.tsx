"use client";

/**
 * ProjectRow — una fila de proyecto de la lista (`ProjectsView`): cabecera
 * siempre visible (estado, nombre, badges derivados, progreso) y, si está
 * seleccionada, el detalle expandido (next step, why, descripción, tareas,
 * log de updates, notas y acciones). Extraído del IIFE `renderRow` de
 * ProjectsView (ver AUDITORIA_CODIGO.md); el cuerpo se preserva tal cual, las
 * variables que antes venían del closure ahora llegan como props y los
 * traductores se resuelven con hooks propios.
 */

import type { ReactNode } from "react";
import {
  Activity,
  ChevronRight,
  Clock,
  Edit2,
  Maximize2,
  Plus,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  Activity as ActivityEntry,
  Category,
  Project,
  ProjectNote,
  Task,
} from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import { daysSince, isDueToday, isOverdue } from "@/lib/date";
import { statusConfig } from "@/lib/status";
import { priorityStripeClass } from "@/lib/priority";
import { NotesSection } from "@/components/projects/notes/NotesSection";
import { ProjectSection } from "@/components/projects/ProjectSection";
import { ShowMoreList } from "@/components/ui/ShowMoreList";
import { ProjectTaskRow } from "../projects/ProjectTaskRow";

interface ProjectRowProps {
  project: Project;
  /** Grip de arrastre inyectado por el modo manual (dnd-kit); ausente en el resto. */
  dragHandle?: ReactNode;
  tasks: Task[];
  activities: ActivityEntry[];
  notesByProject: Record<string, ProjectNote[]>;
  selectedProject: Project | null;
  categoryById: Record<string, Category>;
  onSelectProject: (p: Project | null) => void;
  onOpenProject: (p: Project) => void;
  onAddTaskToProject: (projectId: string) => void;
  onLogUpdate: (p: Project) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void | Promise<void>;
  onEditProject: (p: Project) => void;
  onDeleteProject: (id: string) => void | Promise<void>;
}

export function ProjectRow({
  project: p,
  dragHandle,
  tasks,
  activities,
  notesByProject,
  selectedProject,
  categoryById,
  onSelectProject,
  onOpenProject,
  onAddTaskToProject,
  onLogUpdate,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onEditProject,
  onDeleteProject,
}: ProjectRowProps) {
  const t = useTranslations("views.projects");
  const tCard = useTranslations("views.projects.card");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tPriority = useTranslations("priority");
  const locale = useLocale();

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
  // Soft visual hint only (D9). Not a status — the persisted
  // `stalled` status has its own badge via statusConfig.
  const isIdle =
    ["active", "idea"].includes(p.status) && days >= 7;
  const isExpanded = selectedProject?.id === p.id;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    // ===== Fila base (siempre visible) =====
    <div
      key={p.id}
      className={`relative transition-colors ${
        isExpanded ? "bg-surface/60 ring-1 ring-inset ring-accent/30" : ""
      }`}
    >
      <div
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-1 ${priorityStripeClass[p.priority]}`}
        title={tPriority(p.priority)}
      />
      <div
        className="flex items-center gap-3 pl-5 pr-4 py-2.5 cursor-pointer hover:bg-surface/40"
        onClick={() => onSelectProject(isExpanded ? null : p)}
      >
        {dragHandle}
        <ChevronRight
          size={16}
          className={`shrink-0 text-text-muted transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded border shrink-0 ${statusConfig[p.status]?.color}`}
          title={tStatus(p.status)}
          aria-label={tStatus(p.status)}
        >
          <StatusIcon size={12} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold truncate">{p.name}</span>
            {p.categoryId && categoryById[p.categoryId] && (
              <span
                className={`hidden md:inline-block text-xs px-2 py-0.5 rounded border shrink-0 ${
                  categoryColorClass(
                    categoryById[p.categoryId].color
                  ).chip
                }`}
              >
                {categoryById[p.categoryId].name}
              </span>
            )}
            {/* Un solo badge por prioridad: vencidas > hoy > inactivo
                > horas pendientes. Es excluyente (cadena de ternarios),
                no se apilan. */}
            {overdueCount > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 shrink-0">
                {tCard("overdueBadge", { count: overdueCount })}
              </span>
            ) : todayCount > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/40 shrink-0">
                {tCard("todayBadge", { count: todayCount })}
              </span>
            ) : isIdle ? (
              <span className="hidden md:inline-block text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                {tCard("idleBadge", { count: days })}
              </span>
            ) : pendingEffort > 0 ? (
              <span
                className="hidden md:inline-flex text-xs px-2 py-0.5 rounded bg-accent-2/15 text-accent-2 border border-accent-2/30 items-center gap-1 shrink-0"
                title={tCard("pendingHoursTooltip")}
              >
                <Clock size={10} />
                {tCard("pendingHoursBadge", { hours: pendingEffort })}
              </span>
            ) : null}
          </div>
          {p.nextStep && (
            <div className="text-xs text-text-muted truncate mt-0.5">
              → {p.nextStep}
            </div>
          )}
        </div>
        {total > 0 && (
          <>
            <div className="hidden sm:flex items-center gap-2 shrink-0 w-32">
              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-text-muted tabular-nums w-10 text-right">
                {done}/{total}
              </span>
            </div>
            <span className="sm:hidden text-xs text-text-muted tabular-nums shrink-0">
              {done}/{total}
            </span>
          </>
        )}
      </div>

      {/* ===== Detalle expandido (solo la fila seleccionada) =====
          Los updates ("recent activity") salen de `activities` con
          kind="note"; las notas largas vienen aparte en
          `notesByProject`. */}
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

          {/* --- Tareas: pendientes arriba, hechas colapsadas --- */}
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
              // Pendientes en su orden natural; hechas al final,
              // más recientes primero (por completedAt) y plegadas
              // tras las primeras 5 vía ShowMoreList.
              const pendingTasks = projectTasks.filter((tk) => !tk.done);
              const doneTasks = projectTasks
                .filter((tk) => tk.done)
                .sort((a, b) =>
                  (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
                );
              /** Fila de tarea compartida por pendientes y hechas:
               *  toggle, título, fecha/esfuerzo y acciones editar/borrar. */
              return (
                <div className="space-y-1">
                  {pendingTasks.map((task) => (
                    <ProjectTaskRow
                      key={task.id}
                      task={task}
                      interactive
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
                        interactive
                        onToggleTask={onToggleTask}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                      />
                    )}
                    itemKey={(task) => task.id}
                  />
                </div>
              );
            })()}
          </ProjectSection>

          {/* --- Log de updates (actividad reciente) --- */}
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

          {/* --- Notas largas del proyecto (NotesSection) --- */}
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
}
