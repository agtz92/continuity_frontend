"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import type { Activity, Idea, Project, Routine, Task } from "@/lib/types";
import { daysSince } from "@/lib/date";
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
import { ProjectDetailModal } from "./projects/ProjectDetailModal";
import { ProjectModal } from "./projects/ProjectModal";
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
import { PullToRefresh } from "./ui/PullToRefresh";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { TabBar, type DashboardView } from "./dashboard/TabBar";
import { BottomTabBar } from "./dashboard/BottomTabBar";
import { MoreSheet } from "./dashboard/MoreSheet";
import { AnalyticsView } from "./dashboard/AnalyticsView";
import { LogView } from "./views/LogView";
import { IdeasView } from "./views/IdeasView";
import { QuickNotesView } from "./views/QuickNotesView";
import { TasksView } from "./views/TasksView";
import { ProjectsView } from "./views/ProjectsView";
import { RoutinesView } from "./views/RoutinesView";
import { TodayView } from "./views/TodayView";

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

  const { saveProject, deleteProject: deleteProjectAction } = useProjectMutations();
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

  const [view, setView] = useState<DashboardView>("today");
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [editingNote, setEditingNote] = useState<Activity | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);
  const viewingProject = projects.find((p) => p.id === viewingProjectId) ?? null;

  const activeCount = projects.filter((p) => p.status === "active").length;
  const launchedCount = projects.filter((p) => p.status === "launched").length;
  const stalledCount = projects.filter(
    (p) =>
      ["active", "idea"].includes(p.status) &&
      (daysSince(p.lastActivity) ?? 0) >= 7
  ).length;
  const hasData = projects.length > 0 || tasks.length > 0 || ideas.length > 0;

  const productivityStats = useProductivityStats({
    projects,
    tasks,
    ideas,
    activities,
  });

  // Thin wrappers that close modals on success — Dashboard owns modal state.
  const handleSaveProject = async (p: Parameters<typeof saveProject>[0]) => {
    if (await saveProject(p)) {
      setShowProjectModal(false);
      setEditingProject(null);
    }
  };

  const handleSaveTask = async (t: Parameters<typeof saveTask>[0]) => {
    if (await saveTask(t)) {
      setShowTaskModal(false);
      setEditingTask(null);
    }
  };

  const handleSaveIdea = async (i: Parameters<typeof saveIdea>[0]) => {
    if (await saveIdea(i)) {
      setShowIdeaModal(false);
      setEditingIdea(null);
    }
  };

  const handleSaveRoutine = async (r: Parameters<typeof saveRoutine>[0]) => {
    if (await saveRoutine(r)) {
      setShowRoutineModal(false);
      setEditingRoutine(null);
    }
  };

  const handleSaveNote = async (note: string) => {
    const ok = editingNote
      ? await editNote(editingNote.id, note)
      : selectedProject
      ? await addNote(selectedProject.id, note)
      : false;
    if (ok) {
      setShowNoteModal(false);
      setEditingNote(null);
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
    <AssistantLauncherProvider open={() => setAssistantOpen(true)}>
    <div className="min-h-screen bg-bg text-text">
      <TopNav
        workspace={{
          onOpenCategories: () => setShowCategoriesModal(true),
          onOpenBackup: () => setShowBackupModal(true),
        }}
        rightSlot={<AssistantTrigger onClick={() => setAssistantOpen(true)} />}
      />
      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
      <DashboardTour
        onFinalCta={() => {
          setEditingProject(null);
          setShowProjectModal(true);
        }}
      />
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
            onOpenBackupModal={() => setShowBackupModal(true)}
            onJumpToProject={(p) => {
              setSelectedProject(p);
              setView("projects");
            }}
            onJumpToTasks={() => setView("tasks")}
            onJumpToIdeas={() => setView("ideas")}
            onJumpToRoutines={() => setView("routines")}
            onNewTask={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
            onNewProject={() => {
              setEditingProject(null);
              setShowProjectModal(true);
            }}
            onNewIdea={() => {
              setEditingIdea(null);
              setShowIdeaModal(true);
            }}
            onNewRoutine={() => {
              setEditingRoutine(null);
              setShowRoutineModal(true);
            }}
            onLogUpdate={(p) => {
              setSelectedProject(p);
              setEditingNote(null);
              setShowNoteModal(true);
            }}
            onToggleTask={toggleTask}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskModal(true);
            }}
            onEditRoutine={(r) => {
              setEditingRoutine(r);
              setShowRoutineModal(true);
            }}
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
            onNewProject={() => {
              setEditingProject(null);
              setShowProjectModal(true);
            }}
            onEditProject={(p) => {
              setEditingProject(p);
              setShowProjectModal(true);
            }}
            onDeleteProject={async (id) => {
              await deleteProjectAction(id);
            }}
            onOpenProject={(p) => setViewingProjectId(p.id)}
            onAddTaskToProject={(projectId) => {
              setEditingTask({ projectId });
              setShowTaskModal(true);
            }}
            onLogUpdate={(p) => {
              setSelectedProject(p);
              setEditingNote(null);
              setShowNoteModal(true);
            }}
            onToggleTask={toggleTask}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskModal(true);
            }}
            onDeleteTask={deleteTask}
          />
        )}

        {/* TASKS */}
        {view === "tasks" && (
          <TasksView
            tasks={tasks}
            projects={projects}
            onNewTask={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskModal(true);
            }}
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
            onNewRoutine={() => {
              setEditingRoutine(null);
              setShowRoutineModal(true);
            }}
            onEditRoutine={(r) => {
              setEditingRoutine(r);
              setShowRoutineModal(true);
            }}
            onArchiveRoutine={(r) => archiveRoutine(r.id, !r.archived)}
            onDeleteRoutine={deleteRoutine}
            onCompleteOccurrence={completeOccurrence}
            onUncompleteOccurrence={uncompleteOccurrence}
          />
        )}

        {/* IDEAS */}
        {view === "ideas" && (
          <IdeasView
            ideas={ideas}
            onCapture={() => {
              setEditingIdea(null);
              setShowIdeaModal(true);
            }}
            onEdit={(idea) => {
              setEditingIdea(idea);
              setShowIdeaModal(true);
            }}
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
              setSelectedProject(proj);
              setEditingNote(a);
              setShowNoteModal(true);
            }}
            onDeleteNote={deleteNote}
          />
        )}

        {/* ANALYTICS */}
        {view === "analytics" && <AnalyticsView />}
      </div>

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          categories={categories}
          onSave={handleSaveProject}
          onCreateCategory={createCategory}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
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
          onClose={() => setShowCategoriesModal(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projects={projects}
          tasks={tasks}
          onSave={handleSaveTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}

      {showIdeaModal && (
        <IdeaModal
          idea={editingIdea}
          onSave={handleSaveIdea}
          onClose={() => {
            setShowIdeaModal(false);
            setEditingIdea(null);
          }}
        />
      )}

      {showRoutineModal && (
        <RoutineModal
          routine={editingRoutine}
          projects={projects}
          onSave={handleSaveRoutine}
          onClose={() => {
            setShowRoutineModal(false);
            setEditingRoutine(null);
          }}
        />
      )}

      {showNoteModal && selectedProject && (
        <NoteModal
          projectName={selectedProject.name}
          initialNote={editingNote?.note ?? ""}
          isEdit={!!editingNote}
          onSave={handleSaveNote}
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(null);
          }}
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
            await saveProject({
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
            });
          }}
          onDeleteProject={async (id) => {
            await deleteProjectAction(id);
          }}
          onAddTaskToProject={(projectId) => {
            setEditingTask({ projectId });
            setShowTaskModal(true);
          }}
          onLogUpdate={(p) => {
            setSelectedProject(p);
            setEditingNote(null);
            setShowNoteModal(true);
          }}
          onToggleTask={toggleTask}
          onEditTask={(task) => {
            setEditingTask(task);
            setShowTaskModal(true);
          }}
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
          onClose={() => setShowBackupModal(false)}
        />
      )}

      <BottomTabBar
        view={view}
        onChange={setView}
        onOpenMore={() => setMoreSheetOpen(true)}
      />

      <MoreSheet
        open={moreSheetOpen}
        view={view}
        onSelect={setView}
        onClose={() => setMoreSheetOpen(false)}
      />

      <AssistantFab />
    </div>
    </AssistantLauncherProvider>
  );
}
