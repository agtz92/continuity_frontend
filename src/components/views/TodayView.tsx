"use client";

/**
 * Vista "Hoy" del dashboard: orquesta todas las secciones del día (foco del día,
 * rutinas, completadas hoy, proyectos cerrables, dormidos, ideas viejas, activos y
 * lanzados con tareas) y un modo "personalizar" para reordenar/ocultar secciones.
 * El orden y la visibilidad viven en useTodayLayout; cada sección se prerenderiza
 * en `sectionNodes` y solo se pinta si tiene datos.
 *
 * TODO: refactor — dividir en components/today/<Seccion>.tsx + hook useTodayViewLogic;
 * ~25 estados y render de ~700 líneas (ver AUDITORIA_CODIGO.md)
 */

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  Bell,
  BookOpen,
  Flag,
  Lightbulb,
  Moon,
  Plus,
  Repeat,
  Rocket,
  ScrollText,
  Settings2,
  Snowflake,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  Activity,
  Category,
  Project,
  ProjectNote,
  Routine,
  RoutineOccurrence,
  Task,
} from "@/lib/types";
import { FAB } from "../ui/FAB";
import { useTodayFocus } from "@/hooks/useTodayFocus";
import type { useProductivityStats } from "@/hooks/useProductivityStats";
import { useTodayLayout } from "@/hooks/useTodayLayout";
import { TODAY_SECTIONS, type TodaySectionId } from "@/lib/todaySections";
import { TodayLayoutEditor } from "../today/TodayLayoutEditor";
import { TodayCustomizeBar } from "../today/TodayCustomizeBar";
import { HiddenSectionsFooter } from "../today/HiddenSectionsFooter";
import {
  computeTodayRoutineItems,
  routineCounts,
  routineEffortHours,
} from "../today/todayRoutines";
import { TodayFocusSection } from "../today/TodayFocusSection";
import { DoneTodaySection } from "../today/DoneTodaySection";
import {
  ActiveProjectsSection,
  CloseableSection,
  CountersSection,
  LaunchedWithTasksSection,
  RoutinesTodaySection,
  SleepingSection,
  StaleIdeasSection,
  StalledAlertSection,
} from "../today/sections";
import { TodayActionSheet } from "./TodayActionSheet";
import { ResumeThread } from "../today/ResumeThread";
import { StoppedList } from "../today/StoppedList";
import { CoolingList } from "../today/CoolingList";
import { HomeLogTail } from "../today/HomeLogTail";
import {
  coolingProjects,
  pickResumeThread,
  stoppedProjects,
} from "@/lib/homeSignals";

type ProductivityStats = ReturnType<typeof useProductivityStats>;

function greetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 19) return "afternoon";
  return "evening";
}

// Icon shown next to each section name inside the customize-mode card.
const SECTION_ICON: Record<TodaySectionId, ReactNode> = {
  "resume-thread": <BookOpen size={18} className="text-accent" />,
  stopped: <Ban size={18} className="text-signal" />,
  cooling: <Snowflake size={18} className="text-text-3" />,
  counters: <TrendingUp size={18} className="text-text-3" />,
  "stalled-alert": <Bell size={18} className="text-amber-400" />,
  "today-focus": <Target size={18} className="text-accent" />,
  "routines-today": <Repeat size={18} className="text-text-3" />,
  "done-today": <Sparkles size={18} className="text-accent" />,
  closeable: <Flag size={18} className="text-accent" />,
  sleeping: <Moon size={18} className="text-amber-400" />,
  "stale-ideas": <Lightbulb size={18} className="text-purple-400" />,
  "active-projects": <Zap size={18} className="text-accent" />,
  "launched-with-tasks": <Rocket size={18} className="text-text-3" />,
  "log-tail": <ScrollText size={18} className="text-text-3" />,
};

/**
 * Componente principal de la vista "Hoy". Recibe ya calculados los datos crudos del
 * dashboard (proyectos, tareas, rutinas, actividades, notas, stats de productividad) y
 * los handlers de navegación/mutación; aquí solo deriva los agregados del día y arma el
 * render de cada sección.
 *
 * Efectos secundarios: lee el query param `?customize=1` para abrir el editor de layout
 * una sola vez (y lo limpia con router.replace); llama a `onRefresh` al salir del modo
 * personalizar; delega mutaciones (toggle de tareas, completar ocurrencias, etc.) a los
 * handlers recibidos por props.
 *
 * @returns El árbol de la vista "Hoy" (saludo, secciones visibles u editor de layout, FAB).
 */
export function TodayView({
  projects,
  tasks,
  ideasCount,
  activities,
  projectNotes,
  routines,
  routineOccurrences,
  categoryById,
  hasData,
  productivityStats,
  onJumpToProject,
  onJumpToTasks,
  onJumpToIdeas,
  onJumpToRoutines,
  onJumpToLog,
  onNewTask,
  onNewProject,
  onNewIdea,
  onNewRoutine,
  onLogUpdate,
  onToggleTask,
  onEditTask,
  onEditRoutine,
  onCompleteOccurrence,
  onUncompleteOccurrence,
  onRefresh,
}: {
  projects: Project[];
  tasks: Task[];
  ideasCount: number;
  activities: Activity[];
  projectNotes: ProjectNote[];
  routines: Routine[];
  routineOccurrences: RoutineOccurrence[];
  categoryById: Record<string, Category>;
  hasData: boolean;
  productivityStats: ProductivityStats;
  onJumpToProject: (p: Project) => void;
  onJumpToTasks: () => void;
  onJumpToIdeas: () => void;
  onJumpToRoutines: () => void;
  onJumpToLog: () => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onNewIdea: () => void;
  onNewRoutine: () => void;
  onLogUpdate: (p: Project) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onEditRoutine: (r: Routine) => void;
  onCompleteOccurrence: (
    routineId: string,
    scheduledDate: string
  ) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
  /**
   * Refetch the dashboard data. Called when the user finishes customizing
   * the Today layout so any new sections that became visible reflect the
   * latest server state, and as a safety net in case mutations elsewhere
   * (e.g. opening this view after creating something) left cache stale.
   */
  onRefresh?: () => void | Promise<unknown>;
}) {
  const tGreeting = useTranslations("views.today.greeting");
  const tCounters = useTranslations("views.today.counters");
  const tFab = useTranslations("views.today.fab");
  const tCustom = useTranslations("views.today.customize");
  const tSections = useTranslations("views.today.sections");
  const locale = useLocale();

  const {
    stalled,
    todayFocus,
    todayTaskCounts,
    todayEffortHours,
    doneTodayItems,
    doneTodayEffortHours,
    launchedWithOpenTasks,
  } = useTodayFocus({
    projects,
    tasks,
    activities,
    projectNotes,
    routines,
    routineOccurrences,
  });

  const {
    sleepingProjects,
    closableProjects,
    staleIdeas,
    todayHoursByProject,
    projectProgressById,
    comebackProjectIds,
    comebackGapByProject,
  } = productivityStats;

  const [showFabSheet, setShowFabSheet] = useState(false);

  const layout = useTodayLayout();

  // Hand-off from onboarding step 5: `/dashboard?customize=1` opens the Today
  // layout editor straight away, then strips the param so a refresh doesn't
  // re-trigger it. Runs once.
  const router = useRouter();
  const searchParams = useSearchParams();
  const customizeHandledRef = useRef(false);
  useEffect(() => {
    if (customizeHandledRef.current) return;
    if (searchParams?.get("customize") === "1") {
      customizeHandledRef.current = true;
      layout.setEditMode(true);
      router.replace("/dashboard");
    }
  }, [searchParams, router, layout]);

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  // Rutinas pendientes hoy + agregados; la lógica vive en ../today/todayRoutines.
  const todayRoutineItems = useMemo(
    () => computeTodayRoutineItems(routines, routineOccurrences, projectById),
    [routines, routineOccurrences, projectById]
  );
  const todayRoutineCounts = useMemo(
    () => routineCounts(todayRoutineItems),
    [todayRoutineItems]
  );
  const todayRoutineEffortHours = useMemo(
    () => routineEffortHours(todayRoutineItems),
    [todayRoutineItems]
  );

  const closableTotal =
    closableProjects.quickWins.length + closableProjects.almostThere.length;

  const activeProjectsCount = useMemo(
    () => projects.filter((p) => p.status === "active").length,
    [projects]
  );
  const launchedProjectsCount = useMemo(
    () => projects.filter((p) => p.status === "launched").length,
    [projects]
  );

  // Tarjetas de conteo (solo mobile) con el resumen numérico del día. El orden define el
  // orden visual del carrusel horizontal; los tints son clases sólidas del tema.
  const counters: { id: string; label: string; value: number; tint: string }[] = [
    {
      id: "active",
      label: tCounters("active"),
      value: activeProjectsCount,
      tint: "text-text",
    },
    {
      id: "launched",
      label: tCounters("launched"),
      value: launchedProjectsCount,
      tint: "text-text-3",
    },
    {
      id: "stalled",
      label: tCounters("stalled"),
      value: stalled.length,
      // La única que se enciende, y solo si hay alguno: es la cifra que duele.
      tint: stalled.length > 0 ? "text-signal" : "text-text-3",
    },
    {
      id: "ideas",
      label: tCounters("ideas"),
      value: ideasCount,
      tint: "text-text-3",
    },
    {
      id: "tasks",
      label: tCounters("tasks"),
      value: tasks.length,
      tint: "text-text",
    },
  ];

  // Las tres señales de apertura del Home (S01). `exceptId` es la regla que
  // evita el eco: el protagonista ya dice arriba que está atorado o frío.
  const resume = useMemo(
    () => pickResumeThread(projects, activities),
    [projects, activities]
  );
  const stopped = useMemo(
    () => stoppedProjects(projects, resume?.project.id),
    [projects, resume]
  );
  const cooling = useMemo(
    () => coolingProjects(projects, { exceptId: resume?.project.id }),
    [projects, resume]
  );

  const formattedDate = new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ---------- Section nodes (preserved JSX, one entry per section id) ---------- //
  // A section without data simply has no entry — undefined means "skip render".
  // Cada `if` decide si la sección tiene datos suficientes para pintarse; el orden de
  // estos bloques NO determina el orden visual (eso lo decide `layout.order` en el render).

  const sectionNodes: Partial<Record<TodaySectionId, ReactNode>> = {};

  // --- Sección: resume-thread ("dónde te quedaste", el bloque protagonista) ---
  // Un proyecto, el último tocado. Las tres secciones del rediseño se derivan
  // juntas porque comparten una regla: el protagonista NO se repite abajo.
  if (resume) {
    sectionNodes["resume-thread"] = (
      <ResumeThread
        thread={resume}
        tasks={tasks}
        categoryById={categoryById}
        onOpen={onJumpToProject}
        onLogUpdate={onLogUpdate}
      />
    );
  }

  // --- Sección: stopped (lo atorado, lo más viejo primero) ---
  if (stopped.length > 0) {
    sectionNodes.stopped = (
      <StoppedList
        projects={stopped}
        tasks={tasks}
        onJumpToProject={onJumpToProject}
      />
    );
  }

  // --- Sección: cooling (lo que lleva días sin moverse) ---
  if (cooling.length > 0) {
    sectionNodes.cooling = (
      <CoolingList
        entries={cooling}
        onJumpToProject={onJumpToProject}
        onLogUpdate={onLogUpdate}
      />
    );
  }

  // --- Sección: counters (resumen numérico, solo mobile) ---
  if (hasData) {
    sectionNodes.counters = <CountersSection counters={counters} />;
  }

  // --- Sección: stalled-alert (proyectos estancados que piden atención) ---
  if (stalled.length > 0) {
    sectionNodes["stalled-alert"] = (
      <StalledAlertSection stalled={stalled} onJumpToProject={onJumpToProject} />
    );
  }

  // --- Sección: today-focus (foco del día: tareas vencidas/de hoy + próximos pasos) ---
  // Siempre se registra (sin guard de datos): aun vacía muestra un estado vacío con hint.
  sectionNodes["today-focus"] = (
    <TodayFocusSection
      todayFocus={todayFocus}
      todayTaskCounts={todayTaskCounts}
      todayEffortHours={todayEffortHours}
      projects={projects}
      onToggleTask={onToggleTask}
      onEditTask={onEditTask}
      onJumpToProject={onJumpToProject}
      onJumpToTasks={onJumpToTasks}
    />
  );

  // --- Sección: routines-today (rutinas pendientes hoy y vencidas) ---
  if (todayRoutineItems.length > 0) {
    sectionNodes["routines-today"] = (
      <RoutinesTodaySection
        todayRoutineItems={todayRoutineItems}
        todayRoutineCounts={todayRoutineCounts}
        todayRoutineEffortHours={todayRoutineEffortHours}
        projects={projects}
        categoryById={categoryById}
        onJumpToRoutines={onJumpToRoutines}
        onCompleteOccurrence={onCompleteOccurrence}
        onUncompleteOccurrence={onUncompleteOccurrence}
        onEditRoutine={onEditRoutine}
      />
    );
  }

  // --- Sección: done-today (lo completado hoy: tareas, rutinas y logs/notas de avance) ---
  // doneTodayItems mezcla varios `kind`; `doneTodayFilter` permite ver solo tareas o solo
  // logs, y el filtro actúa como toggle (volver a tocar el chip activo regresa a "all").
  if (doneTodayItems.length > 0) {
    sectionNodes["done-today"] = (
      <DoneTodaySection
        doneTodayItems={doneTodayItems}
        doneTodayEffortHours={doneTodayEffortHours}
        todayHoursByProject={todayHoursByProject}
        projects={projects}
        onJumpToProject={onJumpToProject}
        onEditTask={onEditTask}
        onToggleTask={onToggleTask}
        onUncompleteOccurrence={onUncompleteOccurrence}
      />
    );
  }

  // --- Sección: closeable (proyectos cerca de cerrarse: "casi listos" + "quick wins") ---
  if (closableTotal > 0) {
    sectionNodes.closeable = (
      <CloseableSection closableProjects={closableProjects} onJumpToProject={onJumpToProject} />
    );
  }

  // --- Sección: sleeping (proyectos dormidos por inactividad, agrupados por bucket) ---
  if (sleepingProjects.length > 0) {
    sectionNodes.sleeping = (
      <SleepingSection
        sleepingProjects={sleepingProjects}
        onJumpToProject={onJumpToProject}
        onLogUpdate={onLogUpdate}
      />
    );
  }

  // --- Sección: stale-ideas (ideas viejas sin tocar; banner que lleva a la pestaña Ideas) ---
  if (staleIdeas.length > 0) {
    sectionNodes["stale-ideas"] = (
      <StaleIdeasSection staleIdeas={staleIdeas} onJumpToIdeas={onJumpToIdeas} />
    );
  }

  // --- Sección: active-projects (proyectos en estado "active" como tarjetas compactas) ---
  if (activeProjectsCount > 0) {
    sectionNodes["active-projects"] = (
      <ActiveProjectsSection
        projects={projects}
        tasks={tasks}
        categoryById={categoryById}
        projectProgressById={projectProgressById}
        comebackProjectIds={comebackProjectIds}
        comebackGapByProject={comebackGapByProject}
        onJumpToProject={onJumpToProject}
      />
    );
  }

  // --- Sección: launched-with-tasks (proyectos ya lanzados que aún tienen tareas abiertas) ---
  if (launchedWithOpenTasks.length > 0) {
    sectionNodes["launched-with-tasks"] = (
      <LaunchedWithTasksSection
        launchedWithOpenTasks={launchedWithOpenTasks}
        categoryById={categoryById}
        projectProgressById={projectProgressById}
        comebackProjectIds={comebackProjectIds}
        comebackGapByProject={comebackGapByProject}
        onJumpToProject={onJumpToProject}
      />
    );
  }

  // --- Sección: log-tail (la cola del diario, al pie) ---
  if (activities.length > 0) {
    sectionNodes["log-tail"] = (
      <HomeLogTail
        activities={activities}
        projects={projects}
        onOpenLog={onJumpToLog}
      />
    );
  }

  // ---------- Render ---------- //

  // Entrar/salir del modo "personalizar" (editor de orden y visibilidad de secciones).
  const enterEdit = () => layout.setEditMode(true);
  const exitEdit = () => {
    layout.setEditMode(false);
    // Refresh dashboard so any section that gained data while customizing
    // (or was hidden then unhidden) reflects the latest server state.
    if (onRefresh) {
      void Promise.resolve(onRefresh()).catch(() => undefined);
    }
  };

  const hideLabels = {
    show: tCustom("show"),
    hide: tCustom("hide"),
    locked: tCustom("alwaysVisible"),
    drag: tCustom("dragToReorder"),
  };

  /** Pinta una columna: salta lo oculto y lo que no tiene datos. */
  const renderColumn = (ids: TodaySectionId[]) =>
    ids
      .filter((id) => !layout.hidden.has(id))
      .map((id) => {
        const node = sectionNodes[id];
        if (!node) return null;
        return <Fragment key={id}>{node}</Fragment>;
      });

  /** ¿El lateral tiene algo que pintar? Si no, no se reserva su ancho. */
  const railNodes = layout.rail.filter(
    (id) => !layout.hidden.has(id) && sectionNodes[id]
  );

  const customizeButton = (
    <button
      type="button"
      onClick={enterEdit}
      aria-label={tCustom("entry")}
      title={tCustom("entry")}
      className="shrink-0 p-2 rounded-md text-text-muted hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] transition-colors"
    >
      <Settings2 size={18} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Greeting + customize entry (mobile inline; desktop top-right) */}
      <div className="md:hidden flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-text-muted capitalize">{formattedDate}</div>
          <h1 className="text-2xl font-semibold mt-0.5 truncate">
            {tGreeting(greetingKey())}
          </h1>
        </div>
        {!layout.editMode && customizeButton}
      </div>
      <div className="hidden md:flex items-center justify-end -mb-3">
        {!layout.editMode && customizeButton}
      </div>

      {/*
        Dos modos de render:
        - editMode: lista arrastrable de TODAS las secciones (incl. ocultas y sin datos)
          para reordenar/ocultar; los children van vacíos, solo importa el chrome.
        - normal: recorre layout.order saltando las ocultas y las sin nodo (sin datos),
          y pinta el footer con el conteo de secciones ocultas.
      */}
      {layout.editMode ? (
        <>
          <TodayCustomizeBar
            onExit={exitEdit}
            onReset={layout.reset}
            labels={{
              title: tCustom("title"),
              close: tCustom("close"),
              reset: tCustom("reset"),
              done: tCustom("done"),
            }}
          />
          <TodayLayoutEditor
            layout={layout}
            sectionIcon={SECTION_ICON}
            labelOf={(id) => {
              const meta = TODAY_SECTIONS.find((x) => x.id === id);
              return meta ? tSections(meta.labelKey) : id;
            }}
            hideLabels={hideLabels}
            zoneLabels={{
              main: tCustom("zoneMain"),
              rail: tCustom("zoneRail"),
              mainHint: tCustom("zoneMainHint"),
              railHint: tCustom("zoneRailHint"),
            }}
          />
        </>
      ) : (
        <>
          {/* Dos columnas a partir de `md`. Debajo de eso no hay lateral: a
              390px las secciones del rail siguen en la pila, después de las
              principales, que es donde el usuario las espera. */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
            <div className="flex-1 min-w-0 w-full space-y-6">
              {renderColumn(layout.order)}
            </div>
            {railNodes.length > 0 && (
              <div className="w-full md:w-[300px] shrink-0 space-y-6">
                {renderColumn(layout.rail)}
              </div>
            )}
          </div>
          <HiddenSectionsFooter
            count={layout.hidden.size}
            onCustomize={enterEdit}
            label={tCustom("hiddenFooter", { count: layout.hidden.size })}
          />
        </>
      )}

      {!layout.editMode && (
        <FAB
          icon={<Plus size={24} />}
          label={tFab("open")}
          onClick={() => setShowFabSheet(true)}
        />
      )}

      <TodayActionSheet
        open={showFabSheet && !layout.editMode}
        onClose={() => setShowFabSheet(false)}
        onNewTask={onNewTask}
        onNewProject={onNewProject}
        onNewIdea={onNewIdea}
        onNewRoutine={onNewRoutine}
      />
    </div>
  );
}
