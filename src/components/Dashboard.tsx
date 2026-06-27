"use client";

/**
 * Orquestador principal de la app: enruta entre las vistas del tablero, posee
 * el estado de TODOS los modales (vía useDashboardModals) y maneja la máquina
 * de estados del ciclo de vida de un proyecto (pausar/matar vía rituales de
 * cierre, welcome-back al reactivar, y la cola de proyectos "stalled" que el
 * backend marca al cargar).
 */

import { useMemo, useState } from "react";
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
import { TabBar } from "./dashboard/TabBar";
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
  const { exportData, importData, daysSinceBackup, backupOverdue } = useBackup({
    snapshot: { projects, tasks, ideas, activities, projectNotes: allProjectNotes },
    lastBackup,
    refetch,
  });

  // --- Estado de vista y modales ---
  // Dashboard es el dueño único del estado de los modales (vía useDashboardModals):
  // las vistas hijas solo reciben acciones para abrirlos/poblarlos, y aquí se
  // cierran al confirmar. Las acciones semánticas (newProject, editTask, logUpdate…)
  // viven en el hook para no duplicar los mismos arrows por cada vista.
  const m = useDashboardModals();
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

  /** Open a project: paused → WelcomeBackCard (notes + reactivate); else detail. */
  const openProject = (p: Project) => {
    if (p.status === "paused") {
      setWelcomeBack(p);
    } else {
      setViewingProjectId(p.id);
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
        <div className="text-text-muted">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md bg-surface border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1">Couldn&apos;t load data</div>
              <div className="text-sm text-text-muted mb-3">Error: {error.message}</div>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm"
          >
            Retry
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
      <div className="max-w-7xl mx-auto p-3 sm:p-6 pb-24 md:pb-6">
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

        <TabBar view={view} onChange={setView} />

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
            lastBackup={lastBackup}
            daysSinceBackup={daysSinceBackup}
            backupOverdue={backupOverdue}
            hasData={hasData}
            productivityStats={productivityStats}
            onOpenBackupModal={m.openBackup}
            onJumpToProject={(p) => {
              setSelectedProject(p);
              setView("projects");
            }}
            onJumpToTasks={() => setView("tasks")}
            onJumpToIdeas={() => setView("ideas")}
            onJumpToRoutines={() => setView("routines")}
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
            onCompleteOccurrence={completeOccurrence}
            onUncompleteOccurrence={uncompleteOccurrence}
          />
        )}

        {/* IDEAS */}
        {view === "ideas" && (
          <IdeasView
            ideas={ideas}
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
        {view === "analytics" && <AnalyticsView />}

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
          onClose={() => setViewingProjectId(null)}
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
          onLogUpdate={m.logUpdate}
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
              setViewingProjectId(id);
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
        onChange={setView}
        onOpenMore={() => m.setMoreSheetOpen(true)}
      />

      <MoreSheet
        open={m.moreSheetOpen}
        view={view}
        onSelect={setView}
        onClose={() => m.setMoreSheetOpen(false)}
      />

      <AssistantFab />
    </div>
    </AssistantLauncherProvider>
  );
}
