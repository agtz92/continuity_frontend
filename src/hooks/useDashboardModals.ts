"use client";

/**
 * Estado de UI del tablero: pestaña activa, hoja "más" (mobile) y TODOS los
 * modales (flags `show*` + entidad en edición). Antes vivía inline en
 * Dashboard.tsx como ~16 `useState` + los mismos arrows de abrir/editar
 * repetidos en cada vista (`onNewTask`, `onEditTask`, `onLogUpdate`…). Aquí se
 * centraliza el estado y se exponen **acciones semánticas** para no duplicar los
 * callbacks en el JSX (ver AUDITORIA_CODIGO.md).
 *
 * No conoce datos ni mutaciones: solo estado de presentación. Los handlers de
 * guardado (que cierran su modal al confirmar) y el ciclo de vida del proyecto
 * siguen en Dashboard, porque dependen de las mutaciones.
 */

import { useState } from "react";

import type { Activity, Idea, Project, Routine, Task } from "@/lib/types";
import type { DashboardView } from "@/components/dashboard/TabBar";

export function useDashboardModals() {
  const [view, setView] = useState<DashboardView>("today");
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);

  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);
  const [editingNote, setEditingNote] = useState<Activity | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);

  // --- Acciones semánticas (antes arrows duplicados por cada vista/modal) ---
  const newProject = () => {
    setEditingProject(null);
    setShowProjectModal(true);
  };
  const editProject = (p: Partial<Project>) => {
    setEditingProject(p);
    setShowProjectModal(true);
  };
  const closeProjectModal = () => {
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const newTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };
  const editTask = (t: Partial<Task>) => {
    setEditingTask(t);
    setShowTaskModal(true);
  };
  const addTaskToProject = (projectId: string) => {
    setEditingTask({ projectId });
    setShowTaskModal(true);
  };
  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const newIdea = () => {
    setEditingIdea(null);
    setShowIdeaModal(true);
  };
  const editIdea = (i: Idea) => {
    setEditingIdea(i);
    setShowIdeaModal(true);
  };
  const closeIdeaModal = () => {
    setShowIdeaModal(false);
    setEditingIdea(null);
  };

  const newRoutine = () => {
    setEditingRoutine(null);
    setShowRoutineModal(true);
  };
  const editRoutine = (r: Partial<Routine>) => {
    setEditingRoutine(r);
    setShowRoutineModal(true);
  };
  const closeRoutineModal = () => {
    setShowRoutineModal(false);
    setEditingRoutine(null);
  };

  // Bitácora rápida desde un proyecto (nota nueva); openNoteFor edita una nota
  // existente (lo usa el Log, que primero resuelve el proyecto de la actividad).
  const logUpdate = (p: Project) => {
    setSelectedProject(p);
    setEditingNote(null);
    setShowNoteModal(true);
  };
  const openNoteFor = (project: Project, note: Activity) => {
    setSelectedProject(project);
    setEditingNote(note);
    setShowNoteModal(true);
  };
  const closeNoteModal = () => {
    setShowNoteModal(false);
    setEditingNote(null);
  };

  const openCategories = () => setShowCategoriesModal(true);
  const closeCategories = () => setShowCategoriesModal(false);
  const openBackup = () => setShowBackupModal(true);
  const closeBackup = () => setShowBackupModal(false);

  return {
    // pestaña + hoja "más"
    view,
    setView,
    moreSheetOpen,
    setMoreSheetOpen,
    // flags de modales
    showProjectModal,
    showTaskModal,
    showIdeaModal,
    showNoteModal,
    showBackupModal,
    showCategoriesModal,
    showRoutineModal,
    // entidad en edición / selección
    editingProject,
    editingTask,
    editingIdea,
    editingRoutine,
    editingNote,
    selectedProject,
    setSelectedProject,
    viewingProjectId,
    setViewingProjectId,
    // setters crudos que necesita la integración de ciclo de vida en Dashboard
    setShowProjectModal,
    setEditingProject,
    // acciones semánticas
    newProject,
    editProject,
    closeProjectModal,
    newTask,
    editTask,
    addTaskToProject,
    closeTaskModal,
    newIdea,
    editIdea,
    closeIdeaModal,
    newRoutine,
    editRoutine,
    closeRoutineModal,
    logUpdate,
    openNoteFor,
    closeNoteModal,
    openCategories,
    closeCategories,
    openBackup,
    closeBackup,
  };
}

export type DashboardModalsState = ReturnType<typeof useDashboardModals>;
