"use client";

/**
 * Secciones "chicas" de la vista Hoy, extraídas de TodayView (ver
 * AUDITORIA_CODIGO.md). El JSX se preserva tal cual; el estado de plegado vive
 * en cada componente (UI local) y los datos/callbacks llegan como props.
 */

import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Clock,
  Flag,
  Lightbulb,
  Moon,
  Repeat,
  Rocket,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, Project, Routine, Task } from "@/lib/types";
import { daysSince } from "@/lib/date";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { ProjectCardCompact } from "../projects/ProjectCardCompact";
import { RoutineRow } from "../routines/RoutineRow";
import type { useTodayFocus } from "@/hooks/useTodayFocus";
import type { useProductivityStats } from "@/hooks/useProductivityStats";
import type { TodayRoutineItem } from "./todayRoutines";

type FocusModel = ReturnType<typeof useTodayFocus>;
type Stats = ReturnType<typeof useProductivityStats>;

// Estilos por bucket de antigüedad (días inactivos): ámbar → naranja → rojo.
// Clases fijas de Tailwind a propósito: la urgencia es semántica constante.
const sleepingBucketStyle = {
  "7-14": {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  "15-30": {
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
  },
  "30+": {
    chip: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
} as const;



interface CountersSectionProps {
  counters: { id: string; label: string; value: number; tint: string }[];
}

export function CountersSection({
  counters,
}: CountersSectionProps) {
  return (
      <div
        className="md:hidden flex gap-2 overflow-x-auto snap-x snap-mandatory -mx-3 px-3 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {counters.map((c) => (
          <div
            key={c.id}
            className="snap-start shrink-0 min-w-[120px] bg-surface border border-border rounded-xl px-4 py-3"
          >
            <div className="text-[11px] uppercase tracking-wider text-text-muted">
              {c.label}
            </div>
            <div className={`text-2xl font-bold mt-0.5 ${c.tint}`}>{c.value}</div>
          </div>
        ))}
      </div>
  );
}


interface StalledAlertSectionProps {
  stalled: FocusModel["stalled"];
  onJumpToProject: (p: Project) => void;
}

export function StalledAlertSection({
  stalled, onJumpToProject,
}: StalledAlertSectionProps) {
  const t = useTranslations("views.today");
  return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Bell className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
              {t("stalledAlert.title", { count: stalled.length })}
            </div>
            <div className="text-sm text-amber-700/80 dark:text-amber-200/80">
              {t("stalledAlert.subtitle")}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {stalled.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onJumpToProject(p)}
                  className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-md text-amber-700 dark:text-amber-200"
                >
                  {p.name} · {daysSince(p.lastActivity)}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}


interface RoutinesTodaySectionProps {
  todayRoutineItems: TodayRoutineItem[];
  todayRoutineCounts: { total: number; dueToday: number; overdue: number };
  todayRoutineEffortHours: number;
  projects: Project[];
  categoryById: Record<string, Category>;
  onJumpToRoutines: () => void;
  onCompleteOccurrence: (routineId: string, scheduledDate: string) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
  onEditRoutine: (r: Routine) => void;
}

export function RoutinesTodaySection({
  todayRoutineItems, todayRoutineCounts, todayRoutineEffortHours, projects, categoryById, onJumpToRoutines, onCompleteOccurrence, onUncompleteOccurrence, onEditRoutine,
}: RoutinesTodaySectionProps) {
  const [showRoutinesToday, setShowRoutinesToday] = useState(true);
  const t = useTranslations("views.today");
  const resolveRoutineProject = (r: Routine) => {
    if (!r.projectId) return undefined;
    const proj = projects.find((p) => p.id === r.projectId);
    if (!proj) return undefined;
    const cat = proj.categoryId ? categoryById[proj.categoryId] : undefined;
    return { name: proj.name, color: cat?.color ?? "emerald" };
  };
  return (
      <CollapsibleSection
        open={showRoutinesToday}
        onToggle={() => setShowRoutinesToday((s) => !s)}
        icon={<Repeat size={18} className="text-accent-2" />}
        title={t("routines.title")}
        rightSlot={
          todayRoutineCounts.total > 0 ? (
            <span className="inline-flex items-center gap-2 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToRoutines();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-700 dark:text-orange-200 shadow-sm shadow-orange-500/10 hover:from-orange-500/30 hover:to-red-500/30"
                title={t("routines.routinesTooltip", {
                  dueToday: todayRoutineCounts.dueToday,
                  overdue: todayRoutineCounts.overdue,
                })}
              >
                <Repeat size={11} className="text-orange-700 dark:text-orange-300" />
                <span>
                  {t("routines.routinesLabel", { count: todayRoutineCounts.total })}
                </span>
                {todayRoutineCounts.overdue > 0 && (
                  <span className="text-red-700 dark:text-red-300 font-semibold">
                    {t("routines.overdueExtra", {
                      count: todayRoutineCounts.overdue,
                    })}
                  </span>
                )}
              </button>
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-accent-2/15 text-accent-2 border-accent-2/40"
                title={t("routines.totalHoursTooltip")}
              >
                <Clock size={11} className="text-accent-2" />
                {t("routines.totalHoursLabel", { hours: todayRoutineEffortHours })}
              </span>
            </span>
          ) : null
        }
      >
        <div className="grid md:grid-cols-2 gap-3">
          {todayRoutineItems.map((it) => (
            <RoutineRow
              key={`${it.routine.id}-${it.scheduledDate}`}
              routine={it.routine}
              scheduledDate={it.scheduledDate}
              occurrenceId={null}
              project={resolveRoutineProject(it.routine)}
              onComplete={onCompleteOccurrence}
              onUncomplete={onUncompleteOccurrence}
              onEdit={onEditRoutine}
            />
          ))}
        </div>
      </CollapsibleSection>
  );
}


interface CloseableSectionProps {
  closableProjects: Stats["closableProjects"];
  onJumpToProject: (p: Project) => void;
}

export function CloseableSection({
  closableProjects, onJumpToProject,
}: CloseableSectionProps) {
  const [showCloseable, setShowCloseable] = useState(false);
  const tCloseable = useTranslations("views.today.closeable");
  const closableTotal =
    closableProjects.quickWins.length + closableProjects.almostThere.length;
  return (
      <CollapsibleSection
        open={showCloseable}
        onToggle={() => setShowCloseable((s) => !s)}
        icon={<Flag size={18} className="text-accent" />}
        title={tCloseable("title")}
        rightSlot={
          <span className="text-xs font-normal text-accent bg-accent/10 border border-accent/30 rounded-full px-2 py-0.5">
            {closableTotal}
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {closableProjects.almostThere.map((s) => {
            const pct = Math.round(s.donePct * 100);
            return (
              <button
                key={`almost-${s.project.id}`}
                onClick={() => onJumpToProject(s.project)}
                className="text-left bg-accent/5 border border-accent/30 rounded-xl p-4 hover:border-accent/50 transition-all"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wider font-medium text-accent">
                    {tCloseable("almostThereChip", { pct })}
                  </span>
                </div>
                <div className="font-semibold mb-2 truncate">{s.project.name}</div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden mb-2">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-text-muted">
                  {tCloseable("tasksLeft", {
                    count: s.openCount,
                    done: s.doneCount,
                    total: s.totalCount,
                  })}
                </div>
              </button>
            );
          })}
          {closableProjects.quickWins.map((s) => (
            <button
              key={`quick-${s.project.id}`}
              onClick={() => onJumpToProject(s.project)}
              className="text-left bg-surface border border-border rounded-xl p-4 hover:border-accent/40 transition-all"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-medium text-accent">
                  {tCloseable("quickWin")}
                </span>
              </div>
              <div className="font-semibold mb-2 truncate">{s.project.name}</div>
              <div className="text-xs text-text-muted">
                {tCloseable("tasksAway", { count: s.openCount })}
              </div>
            </button>
          ))}
        </div>
      </CollapsibleSection>
  );
}


interface SleepingSectionProps {
  sleepingProjects: Stats["sleepingProjects"];
  onJumpToProject: (p: Project) => void;
  onLogUpdate: (p: Project) => void;
}

export function SleepingSection({
  sleepingProjects, onJumpToProject, onLogUpdate,
}: SleepingSectionProps) {
  const [showSleepingProjects, setShowSleepingProjects] = useState(false);
  const tSleep = useTranslations("views.today.sleeping");
  return (
      <CollapsibleSection
        open={showSleepingProjects}
        onToggle={() => setShowSleepingProjects((s) => !s)}
        icon={<Moon size={18} className="text-amber-400" />}
        title={tSleep("title")}
        rightSlot={
          <span className="text-xs font-normal text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
            {sleepingProjects.length}
          </span>
        }
      >
        <div className="space-y-2">
          {sleepingProjects.map(({ project, days, bucket }) => {
            const style = sleepingBucketStyle[bucket];
            return (
              <div
                key={project.id}
                className={`flex items-center gap-3 p-3 rounded-xl border bg-surface/60 border-border hover:border-border transition-colors`}
              >
                <span className={`shrink-0 w-2 h-2 rounded-full ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onJumpToProject(project)}
                      className="font-semibold text-text truncate hover:text-accent"
                    >
                      {project.name}
                    </button>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${style.chip}`}
                    >
                      {tSleep("daysIdle", { count: days })}
                    </span>
                  </div>
                  {project.nextStep && (
                    <div className="text-xs text-text-muted truncate mt-0.5">
                      → {project.nextStep}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onLogUpdate(project)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25 transition-colors"
                >
                  {tSleep("resume")}
                </button>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
  );
}


interface StaleIdeasSectionProps {
  staleIdeas: Stats["staleIdeas"];
  onJumpToIdeas: () => void;
}

export function StaleIdeasSection({
  staleIdeas, onJumpToIdeas,
}: StaleIdeasSectionProps) {
  const tStale = useTranslations("views.today.staleIdeas");
  return (
      <button
        onClick={onJumpToIdeas}
        className="w-full text-left bg-purple-500/5 border border-purple-500/30 rounded-xl p-4 hover:bg-purple-500/10 transition-colors"
      >
        <div className="flex items-start gap-3">
          <Lightbulb
            className="text-purple-700 dark:text-purple-300 shrink-0 mt-0.5"
            size={18}
          />
          <div className="flex-1">
            <div className="font-semibold text-purple-700 dark:text-purple-200 mb-1">
              {tStale("title", { count: staleIdeas.length })}
            </div>
            <div className="text-sm text-purple-700/70 dark:text-purple-200/70">
              {tStale("subtitle")}
            </div>
          </div>
          <ChevronRight
            className="text-purple-700 dark:text-purple-300 shrink-0 mt-0.5"
            size={18}
          />
        </div>
      </button>
  );
}


interface ActiveProjectsSectionProps {
  projects: Project[];
  tasks: Task[];
  categoryById: Record<string, Category>;
  projectProgressById: Stats["projectProgressById"];
  comebackProjectIds: Stats["comebackProjectIds"];
  comebackGapByProject: Stats["comebackGapByProject"];
  onJumpToProject: (p: Project) => void;
}

export function ActiveProjectsSection({
  projects, tasks, categoryById, projectProgressById, comebackProjectIds, comebackGapByProject, onJumpToProject,
}: ActiveProjectsSectionProps) {
  const [showActiveProjects, setShowActiveProjects] = useState(false);
  const t = useTranslations("views.today");
  const activeProjectsCount = projects.filter((p) => p.status === "active").length;
  return (
      <CollapsibleSection
        open={showActiveProjects}
        onToggle={() => setShowActiveProjects((s) => !s)}
        icon={<Zap size={18} className="text-accent" />}
        title={t("active.title")}
        rightSlot={
          <span className="text-xs font-normal text-accent bg-accent/10 border border-accent/30 rounded-full px-2 py-0.5">
            {activeProjectsCount}
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects
            .filter((p) => p.status === "active")
            .map((p) => {
              const stats = projectProgressById.get(p.id);
              return (
                <ProjectCardCompact
                  key={p.id}
                  project={p}
                  projectTasks={tasks.filter((tt) => tt.projectId === p.id)}
                  variant="active"
                  categoryById={categoryById}
                  totalEffortHours={stats?.totalEffortHours}
                  todayEffortHours={stats?.todayEffortHours}
                  comebackGapDays={
                    comebackProjectIds.has(p.id)
                      ? comebackGapByProject.get(p.id) ?? null
                      : null
                  }
                  onClick={() => onJumpToProject(p)}
                />
              );
            })}
        </div>
      </CollapsibleSection>
  );
}


interface LaunchedWithTasksSectionProps {
  launchedWithOpenTasks: FocusModel["launchedWithOpenTasks"];
  categoryById: Record<string, Category>;
  projectProgressById: Stats["projectProgressById"];
  comebackProjectIds: Stats["comebackProjectIds"];
  comebackGapByProject: Stats["comebackGapByProject"];
  onJumpToProject: (p: Project) => void;
}

export function LaunchedWithTasksSection({
  launchedWithOpenTasks, categoryById, projectProgressById, comebackProjectIds, comebackGapByProject, onJumpToProject,
}: LaunchedWithTasksSectionProps) {
  const [showLaunchedWithTasks, setShowLaunchedWithTasks] = useState(false);
  const t = useTranslations("views.today");
  return (
      <CollapsibleSection
        open={showLaunchedWithTasks}
        onToggle={() => setShowLaunchedWithTasks((s) => !s)}
        icon={<Rocket size={18} className="text-accent-2" />}
        title={t("launched.title")}
        rightSlot={
          <span className="text-xs font-normal text-accent-2/80 bg-accent-2/10 border border-accent-2/30 rounded-full px-2 py-0.5">
            {launchedWithOpenTasks.length}
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {launchedWithOpenTasks.map(({ project: p, projectTasks }) => {
            const stats = projectProgressById.get(p.id);
            return (
              <ProjectCardCompact
                key={p.id}
                project={p}
                projectTasks={projectTasks}
                variant="launched"
                categoryById={categoryById}
                totalEffortHours={stats?.totalEffortHours}
                todayEffortHours={stats?.todayEffortHours}
                comebackGapDays={
                  comebackProjectIds.has(p.id)
                    ? comebackGapByProject.get(p.id) ?? null
                    : null
                }
                onClick={() => onJumpToProject(p)}
              />
            );
          })}
        </div>
      </CollapsibleSection>
  );
}
