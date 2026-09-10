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
import { daysSince, isDueToday, isOverdue } from "@/lib/date";
import { Spine, spineStrikesTitle } from "@/components/ui/Spine";
import { NAME_SIZE_CLASS, type SmartSection } from "./projectSort";
import { Meta } from "@/components/ui/Meta";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { BlockerBadge } from "@/components/ui/BlockerBadge";
import { ProgressTicks } from "@/components/ui/ProgressTicks";
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
  /** Banda del triaje a la que pertenece. Decide el cuerpo del nombre: la
   *  jerarquía la hace el tamaño, no el gris. En "mi orden" no hay bandas y
   *  todas las filas usan el mismo cuerpo. */
  band?: SmartSection;
}

/** Trama de "detenido", compartida con `tasks/TaskRow` y `ProjectTaskRow`. */
const BLOCKED_HATCH = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--signal-a04) 0 6px, transparent 6px 14px)",
} as const;

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
  band,
}: ProjectRowProps) {
  const t = useTranslations("views.projects");
  const tCard = useTranslations("views.projects.card");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tBlocker = useTranslations("blocker");
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
  // "Atorado" no existe en el modelo: se deriva de tener alguna tarea abierta
  // con blocker. Hasta que el backend lo mande calculado (B1), se calcula aquí.
  const blockedTaskCount = projectTasks.filter(
    (t) => !t.done && (t.blockers?.length ?? 0) > 0
  ).length;
  // El servidor ya manda `isBlocked` derivado (B1); el cálculo local es el
  // fallback para formas cacheadas de antes del rediseño.
  const hasOpenBlocker = p.isBlocked ?? blockedTaskCount > 0;
  const days = p.daysSinceTouch ?? daysSince(p.lastActivity) ?? 0;
  const blockedDays = p.blockedSince ? (daysSince(p.blockedSince) ?? 0) : days;
  // La razón del blocker más antiguo: es el dato que desatasca, no el estado.
  const blockerReason = projectTasks
    .filter((t) => !t.done)
    .flatMap((t) => t.blockers ?? [])
    .sort((a, b) => a.created.localeCompare(b.created))
    .find((b) => b.externalDescription)?.externalDescription;
  // El enfriamiento se dice con el peso de la tinta, no con una alarma.
  const coolingTone =
    (p.cooling ?? (days > 21 ? "cold" : days > 7 ? "cool" : "warm")) === "cold"
      ? "inherit"
      : (p.cooling ?? (days > 7 ? "cool" : "warm")) === "cool"
        ? "muted"
        : "faint";
  // Soft visual hint only (D9). Not a status — the persisted
  // `stalled` status has its own badge via statusConfig.
  const isIdle =
    ["active", "idea"].includes(p.status) && days >= 7;
  const isExpanded = selectedProject?.id === p.id;

  return (
    // ===== Fila base (siempre visible) =====
    <div
      key={p.id}
      // Igual que en la fila de tarea: si está atorado, se ve atorado — la
      // trama recorre la fila entera, no vive solo en el chip.
      style={hasOpenBlocker ? BLOCKED_HATCH : undefined}
      className={`relative transition-colors duration-150 ease-out ${
        isExpanded ? "bg-surface ring-1 ring-inset ring-accent-a35" : ""
      }`}
    >
      <Spine
        status={p.status}
        priority={p.priority}
        blocked={hasOpenBlocker}
        title={hasOpenBlocker ? tStatus("blocked") : tPriority(p.priority)}
      />
      <div
        // Aire por fila. La densidad honesta del plan no es apretar: es que
        // quepa lo que hace falta. Con dos líneas de contenido (nombre y
        // siguiente acción, que ahora puede ocupar dos renglones) 2.5 de padding
        // dejaba los proyectos pegados unos a otros.
        className="flex items-start gap-4 pl-5 pr-4 py-4 cursor-pointer hover:bg-surface"
        onClick={() => onSelectProject(isExpanded ? null : p)}
      >
        {dragHandle}
        <ChevronRight
          size={16}
          className={`shrink-0 mt-1 text-text-muted transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
        {/* El estado lo dice la espina; el icono con caja se cae (el diseño
            prohíbe iconos genéricos junto a cada texto). Queda la etiqueta
            para lectores de pantalla: el color no puede ser la única señal. */}
        <span className="sr-only">{tStatus(p.status)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`font-display-app font-semibold truncate ${
                band ? NAME_SIZE_CLASS[band] : "text-[17px] leading-snug text-text"
              } ${spineStrikesTitle(p.status) ? "line-through text-text-4" : ""}`}
            >
              {p.name}
            </span>
            {hasOpenBlocker && (
              <BlockerBadge compact label since={blockedDays} className="shrink-0" />
            )}
            {/* Un solo badge por prioridad: vencidas > hoy > inactivo
                > horas pendientes. Es excluyente (cadena de ternarios),
                no se apilan. */}
            {overdueCount > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded bg-signal-a12 text-signal border border-signal-a50 shrink-0">
                {tCard("overdueBadge", { count: overdueCount })}
              </span>
            ) : todayCount > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded bg-accent-a12 text-accent border border-accent-a35 shrink-0">
                {tCard("todayBadge", { count: todayCount })}
              </span>
            ) : isIdle ? (
              <span className="hidden md:inline-block text-xs px-2 py-0.5 rounded bg-accent-a12 text-accent border border-accent-a35 shrink-0">
                {tCard("idleBadge", { count: days })}
              </span>
            ) : pendingEffort > 0 ? (
              <span
                className="hidden md:inline-flex text-xs px-2 py-0.5 rounded bg-line-08 text-text-3 border border-line-14 items-center gap-1 shrink-0"
                title={tCard("pendingHoursTooltip")}
              >
                <Clock size={10} />
                {tCard("pendingHoursBadge", { hours: pendingEffort })}
              </span>
            ) : null}
          </div>
          {hasOpenBlocker && blockerReason ? (
            <div className="text-xs text-signal truncate mt-0.5">
              ✕ {blockerReason}
              {blockedTaskCount > 1 ? ` — ${tBlocker("blocksTasks", { count: blockedTaskCount })}` : ""}
            </div>
          ) : p.nextStep ? (
            <div className="text-xs text-text-muted line-clamp-2 mt-0.5">
              <span className="text-accent">→ </span>
              {p.nextStep}
            </div>
          ) : (
            // Que falte la siguiente acción NO es un hueco en blanco: es el
            // mejor predictor de muerte que tiene el producto, así que se dice.
            <div className="text-xs text-text-4 italic mt-0.5">
              {tCard("nextStepEmpty")}
            </div>
          )}
        </div>
        {/* Categoría, progreso y "sin tocar" como columnas: el índice se lee
            en vertical, no fila por fila. Bajo `md` se caen (artboard 11). */}
        <span className="hidden lg:flex shrink-0 w-40 pt-0.5">
          {p.categoryId && categoryById[p.categoryId] ? (
            <CategoryTag
              name={categoryById[p.categoryId].name}
              color={categoryById[p.categoryId].color}
                />
          ) : (
            <CategoryTag loose />
        )}
        </span>
        {total > 0 ? (
          // La fracción arriba y los bloques debajo: "11/14 · 79%" se lee de
          // un vistazo, y los bloques siguen siendo UNO POR TAREA para poder
          // contarlos (los rayados son las bloqueadas).
          <span className="hidden md:flex flex-col items-end gap-1.5 shrink-0 w-[116px]">
            <span className="flex items-baseline gap-0.5 leading-none whitespace-nowrap">
              <span className="font-display-app text-[19px] text-text">{done}</span>
              <Meta tone="faint">
                /{total} · {Math.round((done / total) * 100)}%
              </Meta>
            </span>
            <ProgressTicks
              done={done}
              total={total}
              blocked={blockedTaskCount}
              showLabel={false}
            />
          </span>
        ) : (
          <span className="hidden md:block shrink-0 w-[116px]" />
        )}
        <Meta
          tone={coolingTone}
          className="shrink-0 w-12 text-right pt-1"
          title={tCard("idleBadge", { count: days })}
          >
          {days} D
        </Meta>
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
              className="text-xs px-3 py-1.5 rounded-md bg-accent-a12 hover:bg-accent-a22 border border-accent-a35 text-accent inline-flex items-center gap-1.5 transition-colors"
            >
              <Maximize2 size={12} />
              {t("openFullView")}
            </button>
          </div>

          {/* Next step — always shown, never collapsible */}
          <div className="bg-accent-a12 border border-accent-a35 rounded-lg px-3 py-2">
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
                <span className="text-xs font-normal text-text-muted bg-line-08 border border-border rounded-full px-2 py-0.5 tabular-nums">
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
                <span className="text-xs font-normal text-text-muted bg-line-08 border border-border rounded-full px-2 py-0.5 tabular-nums">
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
                <span className="text-xs font-normal text-text-muted bg-line-08 border border-border rounded-full px-2 py-0.5 tabular-nums">
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
              className="px-3 py-1.5 text-xs bg-signal-a12 hover:bg-signal-a16 text-signal rounded-md flex items-center gap-1"
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
