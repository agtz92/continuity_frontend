"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import type { Idea, Project, Task, UpdateEntry } from "@/lib/types";
import { daysSince } from "@/lib/date";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useIdeaMutations } from "@/hooks/useIdeaMutations";
import { useUpdateMutations } from "@/hooks/useUpdateMutations";
import { useCategoryMutations } from "@/hooks/useCategoryMutations";
import { useBackup } from "@/hooks/useBackup";
import { ProjectModal } from "./projects/ProjectModal";
import { TaskModal } from "./tasks/TaskModal";
import { IdeaModal } from "./ideas/IdeaModal";
import { UpdateModal } from "./updates/UpdateModal";
import { CategoryManagementModal } from "./categories/CategoryManagementModal";
import { BackupRestoreModal } from "./backup/BackupRestoreModal";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { TabBar, type DashboardView } from "./dashboard/TabBar";
import { LogView } from "./views/LogView";
import { IdeasView } from "./views/IdeasView";
import { TasksView } from "./views/TasksView";
import { ProjectsView } from "./views/ProjectsView";
import { TodayView } from "./views/TodayView";

export default function Dashboard() {
  const {
    projects,
    tasks,
    ideas,
    updates,
    categories,
    categoryById,
    lastBackup,
    initialLoading,
    error,
    refetch,
  } = useDashboardData();

  const { saveProject, deleteProject: deleteProjectAction } = useProjectMutations();
  const { saveTask, toggleTask, deleteTask } = useTaskMutations();
  const { saveIdea, deleteIdea, promoteIdea } = useIdeaMutations();
  const { addUpdate, editUpdate, deleteUpdate } = useUpdateMutations();
  const { createCategory, deleteCategory } = useCategoryMutations();
  const { exportData, importData, daysSinceBackup, backupOverdue } = useBackup({
    snapshot: { projects, tasks, ideas, updates },
    lastBackup,
    refetch,
  });

  const [view, setView] = useState<DashboardView>("today");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<UpdateEntry | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const launchedCount = projects.filter((p) => p.status === "launched").length;
  const stalledCount = projects.filter(
    (p) =>
      ["active", "idea"].includes(p.status) &&
      (daysSince(p.lastActivity) ?? 0) >= 7
  ).length;
  const hasData = projects.length > 0 || tasks.length > 0 || ideas.length > 0;

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

  const handleSaveUpdate = async (note: string) => {
    const ok = editingUpdate
      ? await editUpdate(editingUpdate.id, note)
      : selectedProject
      ? await addUpdate(selectedProject.id, note)
      : false;
    if (ok) {
      setShowUpdateModal(false);
      setEditingUpdate(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md bg-zinc-900 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-amber-300 mb-1">Couldn&apos;t load data</div>
              <div className="text-sm text-zinc-400 mb-3">Error: {error.message}</div>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <DashboardHeader
          activeCount={activeCount}
          launchedCount={launchedCount}
          stalledCount={stalledCount}
          backupOverdue={backupOverdue}
          hasData={hasData}
          onOpenCategories={() => setShowCategoriesModal(true)}
          onOpenBackup={() => setShowBackupModal(true)}
          onSignOut={handleSignOut}
        />

        <TabBar view={view} onChange={setView} />

        {/* TODAY */}
        {view === "today" && (
          <TodayView
            projects={projects}
            tasks={tasks}
            updates={updates}
            categoryById={categoryById}
            lastBackup={lastBackup}
            daysSinceBackup={daysSinceBackup}
            backupOverdue={backupOverdue}
            hasData={hasData}
            onOpenBackupModal={() => setShowBackupModal(true)}
            onJumpToProject={(p) => {
              setSelectedProject(p);
              setView("projects");
            }}
            onJumpToTasks={() => setView("tasks")}
            onToggleTask={toggleTask}
          />
        )}

        {/* PROJECTS */}
        {view === "projects" && (
          <ProjectsView
            projects={projects}
            tasks={tasks}
            updates={updates}
            categories={categories}
            categoryById={categoryById}
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
            onAddTaskToProject={(projectId) => {
              setEditingTask({ projectId });
              setShowTaskModal(true);
            }}
            onLogUpdate={(p) => {
              setSelectedProject(p);
              setEditingUpdate(null);
              setShowUpdateModal(true);
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

        {/* LOG */}
        {view === "log" && (
          <LogView
            updates={updates}
            projects={projects}
            onEditUpdate={(u) => {
              const proj = projects.find((p) => p.id === u.projectId);
              if (!proj) return;
              setSelectedProject(proj);
              setEditingUpdate(u);
              setShowUpdateModal(true);
            }}
            onDeleteUpdate={deleteUpdate}
          />
        )}
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

      {showUpdateModal && selectedProject && (
        <UpdateModal
          projectName={selectedProject.name}
          initialNote={editingUpdate?.note ?? ""}
          isEdit={!!editingUpdate}
          onSave={handleSaveUpdate}
          onClose={() => {
            setShowUpdateModal(false);
            setEditingUpdate(null);
          }}
        />
      )}

      {showBackupModal && (
        <BackupRestoreModal
          counts={{
            projects: projects.length,
            tasks: tasks.length,
            ideas: ideas.length,
            updates: updates.length,
          }}
          lastBackup={lastBackup}
          onExport={exportData}
          onImport={(file, mode) => importData(file, mode)}
          onClose={() => setShowBackupModal(false)}
        />
      )}
    </div>
  );
}
