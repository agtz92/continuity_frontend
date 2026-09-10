"use client";

/**
 * Orquestador principal de la app: enruta entre las vistas del tablero, posee
 * el estado de TODOS los modales (vía useDashboardModals) y maneja la máquina
 * de estados del ciclo de vida de un proyecto (pausar/matar vía rituales de
 * cierre, welcome-back al reactivar, y la cola de proyectos "stalled" que el
 * backend marca al cargar).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import type { Project } from "@/lib/types";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLocaleSync } from "@/hooks/useLocaleSync";
import { useThemeSync } from "@/hooks/useThemeSync";
import { usePaletteSync } from "@/hooks/usePaletteSync";
import { useProductivityStats } from "@/hooks/useProductivityStats";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useIdeaMutations } from "@/hooks/useIdeaMutations";
import { useNoteMutations } from "@/hooks/useNoteMutations";
import { useCategoryMutations } from "@/hooks/useCategoryMutations";
import { useRoutineMutations } from "@/hooks/useRoutineMutations";
import { useBackup } from "@/hooks/useBackup";
import { useStalledQueue } from "@/hooks/useStalledQueue";
import { useProjectLifecycle } from "@/hooks/useProjectLifecycle";
import { useDashboardModals } from "@/hooks/useDashboardModals";
import { ProjectDetailModal } from "./projects/ProjectDetailModal";
import { ProjectModal } from "./projects/ProjectModal";
import { PauseProjectModal } from "./projects/PauseProjectModal";
import { KillProjectModal } from "./projects/KillProjectModal";
import { StalledProjectModal } from "./projects/StalledProjectModal";
import { WelcomeBackCard } from "./projects/WelcomeBackCard";
import { GraveyardView } from "./projects/GraveyardView";
import { TaskModal } from "./tasks/TaskModal";
import { IdeaModal } from "./ideas/IdeaModal";
import { NoteModal } from "./updates/UpdateModal";
import { CategoryManagementModal } from "./categories/CategoryManagementModal";
import { RoutineModal } from "./routines/RoutineModal";
import { BackupRestoreModal } from "./backup/BackupRestoreModal";
import { TopNav } from "./layout/TopNav";
import { DashboardTour } from "./dashboard/DashboardTour";
import { NotificationStack } from "./notifications/NotificationStack";
import { AssistantTrigger } from "./assistant/AssistantTrigger";
import { AssistantPanel } from "./assistant/AssistantPanel";
import { AssistantFab } from "./assistant/AssistantFab";
import { AssistantLauncherProvider } from "./assistant/useAssistantLauncher";
import { useAssistant } from "@/hooks/useAssistant";
import { projectCapForPlan, countsTowardCap } from "@/lib/planQuotas";
import { PullToRefresh } from "./ui/PullToRefresh";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { BottomTabBar } from "./dashboard/BottomTabBar";
import { MoreSheet } from "./dashboard/MoreSheet";
import { AnalyticsView } from "./dashboard/AnalyticsView";
import { LogView } from "./views/LogView";
import { IdeasView } from "./views/IdeasView";
import { QuickNotesView } from "./views/QuickNotesView";
import { TasksView } from "./views/TasksView";
import { ProjectsView } from "./views/ProjectsView";
import { RoutinesView } from "./views/RoutinesView";
import { CalendarView } from "./views/CalendarView";
import { TodayView } from "./views/TodayView";
import type { DashboardView } from "@/lib/dashboardViews";
import { Sidebar, type SidebarCounts } from "./layout/Sidebar";
import { CommandPalette } from "./ui/CommandPalette";
import { dashboardHref, parseDashboardRoute } from "@/lib/dashboardRoutes";
import { useTranslations } from "next-intl";

/**
 * Componente raíz del tablero. Coordina la carga de datos (useDashboardData),
 * las mutaciones por entidad (proyectos/tareas/ideas/notas/categorías/rutinas),
 * el estado de modales/vistas (useDashboardModals) y los rituales de ciclo de
 * vida de proyecto (useProjectLifecycle / useStalledQueue).
 */
export default function Dashboard() {
  useLocaleSync();
  useThemeSync();
  usePaletteSync();
  const {
    projects,
    tasks,
    ideas,
    activities,
    categories,
    categoryById,
    notesByProject,
    routines,
    routineOccurrences,
    lastBackup,
    initialLoading,
    error,
    refetch,
  } = useDashboardData();

  const {
    saveProject,
    deleteProject: deleteProjectAction,
    applyParkedDueDates,
    reorderProjects,
  } = useProjectMutations();
  const { saveTask, toggleTask, deleteTask } = useTaskMutations();
  const { saveIdea, deleteIdea, promoteIdea } = useIdeaMutations();
  const { addNote, editNote, deleteNote } = useNoteMutations();
  const { createCategory, updateCategory, deleteCategory } = useCategoryMutations();
  const {
    saveRoutine,
    archiveRoutine,
    deleteRoutine,
    completeOccurrence,
    uncompleteOccurrence,
  } = useRoutineMutations();
  const allProjectNotes = useMemo(
    () => Object.values(notesByProject).flat(),
    [notesByProject]
  );
    const { exportData, importData } = useBackup({
    snapshot: { projects, tasks, ideas, activities, projectNotes: allProjectNotes },
    lastBackup,
    refetch,
  });

  // --- Estado de vista y modales ---
  // Dashboard es el dueño único del estado de los modales (vía useDashboardModals):
  // las vistas hijas solo reciben acciones para abrirlos/poblarlos, y aquí se
  // cierran al confirmar. Las acciones semánticas (newProject, editTask, logUpdate…)
  // viven en el hook para no duplicar los mismos arrows por cada vista.
  // La URL manda. `usePathname` se actualiza sin desmontar porque este
  // componente vive en el layout, no en la página (ver dashboard/layout.tsx).
  const pathname = usePathname();
  const route = useMemo(() => {
    const segs = pathname.split("/").filter(Boolean); // ["dashboard", …]
    return parseDashboardRoute(segs.slice(1));
  }, [pathname]);

  const m = useDashboardModals({
    view: route.view,
    viewingProjectId: route.projectId,
  });
  const {
    view,
    setView,
    showProjectModal,
    showTaskModal,
    showIdeaModal,
    showNoteModal,
    showBackupModal,
    showCategoriesModal,
    showRoutineModal,
    editingProject,
    editingTask,
    editingIdea,
    editingRoutine,
    editingNote,
    selectedProject,
    setSelectedProject,
    viewingProjectId,
    setViewingProjectId,
  } = m;
  const viewingProject = projects.find((p) => p.id === viewingProjectId) ?? null;

  // El asistente (panel + prompt pre-cargado) es estado aparte del de los modales
  // de entidad; lo expone el AssistantLauncherProvider a toda la app.
  const [assistantOpen, setAssistantOpen] = useState(false);
  // When set, the assistant panel pre-fills this prompt into its input on open.
  const [assistantPrompt, setAssistantPrompt] = useState<string | null>(null);
  const openAssistant = (initialPrompt?: string) => {
    if (initialPrompt) setAssistantPrompt(initialPrompt);
    setAssistantOpen(true);
  };

  // --- Ciclo de vida (State Closure) + cola de stalled, en hooks dedicados ---
  // Pausar/matar exigen notas de cierre, reactivar abre un welcome-back, y los
  // stalled se procesan de a uno. La máquina vive en useProjectLifecycle; la cola
  // en useStalledQueue (ver AUDITORIA_CODIGO.md).
  type SaveArgs = Parameters<typeof saveProject>[0];
  const {
    closure,
    setClosure,
    welcomeBack,
    setWelcomeBack,
    requestSaveProject,
    handleClosureConfirm,
  } = useProjectLifecycle<SaveArgs>(saveProject, m.closeProjectModal);
  const { currentStalled, dismissStalled } = useStalledQueue(projects);

  // --- Navegación: la URL manda, el estado va delante para no esperar al router ---
  const tCommon = useTranslations("common");
  const tDash = useTranslations("dashboard");

  const router = useRouter();

  /**
   * Cambia de vista (y opcionalmente abre un proyecto). Escribe el estado
   * primero para que el render sea inmediato y empuja la URL después; el efecto
   * de abajo reconcilia y queda en no-op.
   */
  const goTo = useCallback(
    (next: DashboardView, projectId: string | null = null) => {
      setView(next);
      setViewingProjectId(projectId);
      router.push(dashboardHref(next, projectId));
    },
    [router, setView, setViewingProjectId]
  );

  /**
   * La URL cambió por fuera: atrás/adelante del navegador, un enlace pegado o
   * una recarga. Aquí el estado la sigue.
   */
  useEffect(() => {
    setView(route.view);
    setViewingProjectId(route.projectId);
  }, [route.view, route.projectId, setView, setViewingProjectId]);

  // --- Captura rápida (⌘K) ---
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      // Con otro diálogo abierto el atajo no se roba el foco: la captura
      // rápida es para capturar, no para interrumpir lo que estabas haciendo.
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      setPaletteOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Open a project: paused → WelcomeBackCard (notes + reactivate); else detail. */
  const openProject = (p: Project) => {
    if (p.status === "paused") {
      setWelcomeBack(p);
    } else {
      goTo("projects", p.id);
    }
  };

  /** Build a full SaveArgs payload from a project + status override. */
  const projectToSaveArgs = (p: Project, status: string): SaveArgs => ({
    id: p.id,
    name: p.name,
    description: p.description,
    why: p.why,
    nextStep: p.nextStep,
    status,
    priority: p.priority,
    categoryId: p.categoryId,
    dueDate: p.dueDate,
  });

  const activeCount = projects.filter((p) => p.status === "active").length;
  const launchedCount = projects.filter((p) => p.status === "launched").length;
  const stalledCount = projects.filter((p) => p.status === "stalled").length;

  // Plan cap line for the Revive modal. `useAssistant().plan` is the client-side
  // source of truth; the cap mirrors the backend ENTITY_QUOTAS["projects"].
  const { plan } = useAssistant();
  const activeCap = projectCapForPlan(plan);
  const capUsed = useMemo(
    () => projects.filter((p) => countsTowardCap(p.status)).length,
    [projects]
  );
  const hasData = projects.length > 0 || tasks.length > 0 || ideas.length > 0;

  /**
   * Contadores de la barra lateral. Son metadato, no alarma: el único que se
   * enciende es `blocked`. `routines` cuenta las rutinas vivas, no las de hoy —
   * el número de la navegación dice cuánto hay, no cuánto urge.
   */
  const sidebarCounts: SidebarCounts = useMemo(
    () => ({
      projects: projects.filter((p) => p.status === "active").length,
      tasks: tasks.filter((t) => !t.done).length,
      routines: routines.filter((r) => !r.archived).length,
      ideas: ideas.length,
      notes: allProjectNotes.length,
      blocked: projects.filter(
        (p) =>
          p.isBlocked ??
          tasks.some(
            (t) =>
              t.projectId === p.id && !t.done && (t.blockers?.length ?? 0) > 0
          )
      ).length,
    }),
    [projects, tasks, routines, ideas, allProjectNotes]
  );

  const productivityStats = useProductivityStats({
    projects,
    tasks,
    ideas,
    activities,
  });

  // --- Handlers de guardado: cierran su modal solo si la mutación tuvo éxito ---
  // Thin wrappers that close modals on success — Dashboard owns modal state.
  const handleSaveProject = async (p: Parameters<typeof saveProject>[0]) => {
    // Editing an existing project to paused/killed → route through the closure
    // ritual. The ProjectModal stays open behind the closure modal; closing it
    // happens after the notes are saved (handleClosureConfirm).
    const prevStatus = editingProject?.id ? editingProject.status : undefined;
    if (p.id && prevStatus && p.status !== prevStatus &&
        (p.status === "paused" || p.status === "killed")) {
      await requestSaveProject(p, prevStatus);
      return;
    }
    if (await saveProject(p)) {
      m.closeProjectModal();
    }
  };

  const handleSaveTask = async (t: Parameters<typeof saveTask>[0]) => {
    if (await saveTask(t)) {
      m.closeTaskModal();
    }
  };

  const handleSaveIdea = async (i: Parameters<typeof saveIdea>[0]) => {
    if (await saveIdea(i)) {
      m.closeIdeaModal();
    }
  };

  const handleSaveRoutine = async (r: Parameters<typeof saveRoutine>[0]) => {
    if (await saveRoutine(r)) {
      m.closeRoutineModal();
    }
  };

  const handleSaveNote = async (note: string) => {
    const ok = editingNote
      ? await editNote(editingNote.id, note)
      : selectedProject
      ? await addNote(selectedProject.id, note)
      : false;
    if (ok) {
      m.closeNoteModal();
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted">{tCommon("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md bg-surface border border-signal-a50 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="text-signal shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-signal mb-1">
                {tDash("loadErrorTitle")}
              </div>
              <div className="text-sm text-text-muted mb-3">
                {tDash("loadErrorDetail", { message: error.message })}
              </div>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm"
          >
            {tCommon("retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AssistantLauncherProvider open={openAssistant}>
    <div className="min-h-screen bg-bg text-text">
      <TopNav
        workspace={{
          onOpenCategories: m.openCategories,
          onOpenBackup: m.openBackup,
        }}
        rightSlot={<AssistantTrigger onClick={() => setAssistantOpen(true)} />}
      />
      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        initialPrompt={assistantPrompt}
        onConsumePrompt={() => setAssistantPrompt(null)}
      />
      <DashboardTour onFinalCta={m.newProject} />
      <PullToRefresh onRefresh={() => refetch()} />
      {paletteOpen && (
        <CommandPalette
          projects={projects}
          onClose={() => setPaletteOpen(false)}
          onOpenProject={openProject}
        />
      )}
      <div className="flex">
      <Sidebar
        view={view}
        counts={sidebarCounts}
        onChange={goTo}
        onQuickCapture={() => setPaletteOpen(true)}
      />
      <div className="flex-1 min-w-0 max-w-7xl mx-auto p-3 sm:p-6 pb-24 md:pb-6">
        <NotificationStack />
        <div className="hidden md:block">
          <DashboardHeader
            activeCount={activeCount}
            launchedCount={launchedCount}
            stalledCount={stalledCount}
            activeThisWeek={productivityStats.activeThisWeek}
            hasData={hasData}
          />
        </div>

        {/* --- Ruteo de vista: una sola pestaña activa según `view` --- */}

        {/* TODAY */}
        {view === "today" && (
          <TodayView
            projects={projects}
            tasks={tasks}
            ideasCount={ideas.length}
            activities={activities}
            projectNotes={allProjectNotes}
            routines={routines}
            routineOccurrences={routineOccurrences}
            categoryById={categoryById}
            hasData={hasData}
            productivityStats={productivityStats}
            onJumpToProject={(p) => {
              setSelectedProject(p);
              goTo("projects");
            }}
            onJumpToTasks={() => goTo("tasks")}
            onJumpToIdeas={() => goTo("ideas")}
            onJumpToRoutines={() => goTo("routines")}
            onJumpToLog={() => goTo("log")}
            onNewTask={m.newTask}
            onNewProject={m.newProject}
            onNewIdea={m.newIdea}
            onNewRoutine={m.newRoutine}
            onLogUpdate={m.logUpdate}
            onToggleTask={toggleTask}
            onEditTask={m.editTask}
            onEditRoutine={m.editRoutine}
            onCompleteOccurrence={completeOccurrence}
            onUncompleteOccurrence={uncompleteOccurrence}
            onRefresh={refetch}
          />
        )}

        {/* PROJECTS */}
        {view === "projects" && (
          <ProjectsView
            projects={projects}
            tasks={tasks}
            activities={activities}
            categories={categories}
            categoryById={categoryById}
            notesByProject={notesByProject}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onNewProject={m.newProject}
            onEditProject={m.editProject}
            onDeleteProject={async (id) => {
              await deleteProjectAction(id);
            }}
            onReorderProjects={reorderProjects}
            onOpenProject={openProject}
            onAddTaskToProject={m.addTaskToProject}
            onLogUpdate={m.logUpdate}
            onToggleTask={toggleTask}
            onEditTask={m.editTask}
            onDeleteTask={deleteTask}
          />
        )}

        {/* TASKS */}
        {view === "tasks" && (
          <TasksView
            tasks={tasks}
            projects={projects}
            onNewTask={m.newTask}
            onEditTask={m.editTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        )}

        {/* ROUTINES */}
        {view === "routines" && (
          <RoutinesView
            routines={routines}
            occurrences={routineOccurrences}
            projects={projects}
            categories={categories}
            onNewRoutine={m.newRoutine}
            onEditRoutine={m.editRoutine}
            onArchiveRoutine={(r) => archiveRoutine(r.id, !r.archived)}
            onDeleteRoutine={deleteRoutine}
            onCompleteOccurrence={completeOccurrence}
            onUncompleteOccurrence={uncompleteOccurrence}
          />
        )}

        {/* CALENDAR */}
        {view === "calendar" && (
          <CalendarView
            projects={projects}
            tasks={tasks}
            routines={routines}
            occurrences={routineOccurrences}
            categories={categories}
            onOpenProject={openProject}
            onEditTask={m.editTask}
            onToggleTask={toggleTask}
            onEditRoutine={m.editRoutine}
          />
        )}

        {/* IDEAS */}
        {view === "ideas" && (
          <IdeasView
            ideas={ideas}
            categories={categories}
            onCapture={m.newIdea}
            onEdit={m.editIdea}
            onPromote={promoteIdea}
            onDelete={deleteIdea}
          />
        )}

        {/* QUICK NOTES */}
        {view === "notes" && (
          <QuickNotesView categories={categories} projects={projects} />
        )}

        {/* LOG */}
        {view === "log" && (
          <LogView
            activities={activities}
            projects={projects}
            onEditNote={(a) => {
              const proj = projects.find((p) => p.id === a.projectId);
              if (!proj) return;
              m.openNoteFor(proj, a);
            }}
            onDeleteNote={deleteNote}
          />
        )}

        {/* ANALYTICS */}
        {view === "analytics" && (
          <AnalyticsView
            projects={projects}
            tasks={tasks}
            activities={activities}
            categories={categories}
          />
        )}

        {/* GRAVEYARD */}
        {view === "graveyard" && (
          <GraveyardView
            projects={projects}
            tasks={tasks}
            activeUsed={capUsed}
            activeCap={activeCap ?? undefined}
            onRevive={async (project, target, restoreDates) => {
              const ok = await saveProject(projectToSaveArgs(project, target));
              if (
                ok &&
                tasks.some((tk) => tk.projectId === project.id && tk.parkedDueDate)
              ) {
                await applyParkedDueDates(project.id, restoreDates);
              }
              return ok;
            }}
            onOpenAssistant={openAssistant}
          />
        )}
      </div>
      </div>

      {/* --- Capa de modales: montados a nivel raíz, gateados por su flag de estado --- */}

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          categories={categories}
          onSave={handleSaveProject}
          onCreateCategory={createCategory}
          onClose={m.closeProjectModal}
        />
      )}

      {showCategoriesModal && (
        <CategoryManagementModal
          categories={categories}
          onCreate={async (name, color) => {
            await createCategory({ name, color });
          }}
          onUpdate={async (id, name, color) => {
            await updateCategory(id, { name, color });
          }}
          onDelete={async (id) => {
            await deleteCategory(id);
          }}
          onClose={m.closeCategories}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projects={projects}
          tasks={tasks}
          onSave={handleSaveTask}
          onDelete={deleteTask}
          onClose={m.closeTaskModal}
        />
      )}

      {showIdeaModal && (
        <IdeaModal
          idea={editingIdea}
          onSave={handleSaveIdea}
          onClose={m.closeIdeaModal}
        />
      )}

      {showRoutineModal && (
        <RoutineModal
          routine={editingRoutine}
          projects={projects}
          onSave={handleSaveRoutine}
          onDelete={deleteRoutine}
          onClose={m.closeRoutineModal}
        />
      )}

      {showNoteModal && selectedProject && (
        <NoteModal
          projectName={selectedProject.name}
          initialNote={editingNote?.note ?? ""}
          isEdit={!!editingNote}
          onSave={handleSaveNote}
          onClose={m.closeNoteModal}
        />
      )}

      {viewingProject && (
        <ProjectDetailModal
          project={viewingProject}
          tasks={tasks}
          activities={activities}
          notes={notesByProject[viewingProject.id] ?? []}
          categories={categories}
          categoryById={categoryById}
          onClose={() => goTo("projects")}
          onSaveProject={async (patch) => {
            await requestSaveProject(
              {
                id: viewingProject.id,
                name: patch.name ?? viewingProject.name,
                description:
                  patch.description !== undefined
                    ? patch.description
                    : viewingProject.description,
                why: patch.why !== undefined ? patch.why : viewingProject.why,
                nextStep:
                  patch.nextStep !== undefined
                    ? patch.nextStep
                    : viewingProject.nextStep,
                status: patch.status ?? viewingProject.status,
                priority: patch.priority ?? viewingProject.priority,
                categoryId:
                  patch.categoryId !== undefined
                    ? patch.categoryId
                    : viewingProject.categoryId,
                dueDate:
                  patch.dueDate !== undefined
                    ? patch.dueDate
                    : viewingProject.dueDate,
              },
              viewingProject.status
            );
          }}
          onDeleteProject={async (id) => {
            await deleteProjectAction(id);
          }}
          onAddTaskToProject={m.addTaskToProject}
          onToggleTask={toggleTask}
          onEditTask={m.editTask}
          onDeleteTask={deleteTask}
        />
      )}

      {showBackupModal && (
        <BackupRestoreModal
          counts={{
            projects: projects.length,
            tasks: tasks.length,
            ideas: ideas.length,
            activities: activities.length,
          }}
          lastBackup={lastBackup}
          onExport={exportData}
          onImport={(file, mode) => importData(file, mode)}
          onClose={m.closeBackup}
        />
      )}

      {/* Closure rituals — pause / kill require notes before saving. */}
      {closure?.mode === "pause" && (
        <PauseProjectModal
          projectName={closure.projectName}
          onConfirm={(notes) => handleClosureConfirm(notes)}
          onClose={() => setClosure(null)}
        />
      )}
      {closure?.mode === "kill" && (
        <KillProjectModal
          projectName={closure.projectName}
          onConfirm={(notes) => handleClosureConfirm(notes)}
          onClose={() => setClosure(null)}
        />
      )}

      {/* Welcome back — opening a paused project surfaces its notes. */}
      {welcomeBack && (() => {
        const parked = tasks.filter(
          (tk) => tk.projectId === welcomeBack.id && tk.parkedDueDate
        );
        const nextParked = parked.reduce<string | null>(
          (soonest, tk) =>
            !soonest || (tk.parkedDueDate as string) < soonest
              ? (tk.parkedDueDate as string)
              : soonest,
          null
        );
        return (
        <WelcomeBackCard
          project={welcomeBack}
          parkedTaskCount={parked.length}
          nextParkedDate={nextParked}
          onReactivate={async (restoreDates) => {
            const ok = await saveProject(
              projectToSaveArgs(welcomeBack, "active")
            );
            if (ok) {
              const id = welcomeBack.id;
              if (parked.length > 0) {
                await applyParkedDueDates(id, restoreDates);
              }
              setWelcomeBack(null);
              goTo("projects", id);
            }
            return ok;
          }}
          onClose={() => setWelcomeBack(null)}
        />
        );
      })()}

      {/* Stalled queue — one project at a time on load. */}
      {/* Se suprime si hay un cierre o welcome-back abiertos: esos modales nacen
          DESDE el stalled (pausar/matar) y no deben quedar tapados por él. */}
      {currentStalled && !closure && !welcomeBack && (
        <StalledProjectModal
          project={currentStalled}
          onKeepActive={async () => {
            const ok = await saveProject(
              projectToSaveArgs(currentStalled, "active")
            );
            if (ok) dismissStalled(currentStalled.id);
          }}
          onPause={() => {
            dismissStalled(currentStalled.id);
            setClosure({
              mode: "pause",
              projectName: currentStalled.name,
              base: projectToSaveArgs(currentStalled, "paused"),
            });
          }}
          onKill={() => {
            dismissStalled(currentStalled.id);
            setClosure({
              mode: "kill",
              projectName: currentStalled.name,
              base: projectToSaveArgs(currentStalled, "killed"),
            });
          }}
          onClose={() => dismissStalled(currentStalled.id)}
        />
      )}

      <BottomTabBar
        view={view}
        onChange={goTo}
        onOpenMore={() => m.setMoreSheetOpen(true)}
      />

      <MoreSheet
        open={m.moreSheetOpen}
        view={view}
        onSelect={goTo}
        onClose={() => m.setMoreSheetOpen(false)}
      />

      <AssistantFab />
    </div>
    </AssistantLauncherProvider>
  );
}
