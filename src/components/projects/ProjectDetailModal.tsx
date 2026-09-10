"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import type {
  Activity,
  Category,
  Project,
  ProjectNote,
  Task,
} from "@/lib/types";
import { ProjectDetailPanel } from "./ProjectDetailPanel";

/**
 * El **chasis** del detalle de proyecto: capa oscura, caja, ESC y bloqueo de
 * scroll. Nada más.
 *
 * Todo el contenido vive en `ProjectDetailPanel`. La separación es deliberada:
 * el rediseño quiere el detalle como pantalla con ruta propia
 * (`/dashboard/p/[id]`), y eso depende del chasis de navegación de la ola 4.
 * Cuando llegue ese día, la migración es montar el panel en una página y borrar
 * este archivo — no reescribir la pantalla.
 */
export function ProjectDetailModal({
  project,
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
  onClose: () => void;
  onSaveProject: (patch: Partial<Project>) => void | Promise<void>;
  onDeleteProject: (id: string) => void | Promise<void>;
  onAddTaskToProject: (projectId: string) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void | Promise<void>;
}) {
  const tDetail = useTranslations("views.projects.detail");

  // ESC closes; lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      // z-40 (below the Modal helper at z-50) so TaskModal / UpdateModal
      // float above this one when invoked from inside.
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={tDetail("title")}
    >
      <div className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div className="relative w-full max-w-5xl h-[92vh] bg-bg border border-border rounded-lg shadow-hard-lg flex flex-col overflow-hidden">
        <ProjectDetailPanel
          project={project}
          tasks={tasks}
          activities={activities}
          notes={notes}
          categories={categories}
          categoryById={categoryById}
          onClose={onClose}
          onSaveProject={onSaveProject}
          onDeleteProject={onDeleteProject}
          onAddTaskToProject={onAddTaskToProject}
          onToggleTask={onToggleTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      </div>
    </div>
  );
}
