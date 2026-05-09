"use client";

import { useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Edit2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  Category,
  Priority,
  Project,
  ProjectNote,
  ProjectStatus,
  Task,
  UpdateEntry,
} from "@/lib/types";
import {
  PRIORITIES,
  categoryColorClass,
  priorityMeta,
} from "@/lib/types";
import { statusConfig } from "@/lib/status";
import { NotesSection } from "@/components/projects/notes/NotesSection";
import { ProjectSection } from "@/components/projects/ProjectSection";
import {
  InlineText,
  InlineTextarea,
} from "@/components/projects/InlineEdit";

const STATUS_OPTIONS: ProjectStatus[] = [
  "idea",
  "active",
  "stalled",
  "paused",
  "launched",
  "archived",
];

/**
 * Near-fullscreen workspace for a single project. ALL project fields are
 * editable inline (click → edit → blur to save). Tasks/updates still use
 * their respective small modals which now float ABOVE this one (this modal
 * uses z-40, Modal-helper-based dialogs use z-50).
 */
export function ProjectDetailModal({
  project: p,
  tasks,
  updates,
  notes,
  categories,
  categoryById,
  onClose,
  onSaveProject,
  onDeleteProject,
  onAddTaskToProject,
  onLogUpdate,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: {
  project: Project;
  tasks: Task[];
  updates: UpdateEntry[];
  notes: ProjectNote[];
  categories: Category[];
  categoryById: Record<string, Category>;
  onClose: () => void;
  onSaveProject: (patch: Partial<Project>) => void | Promise<void>;
  onDeleteProject: (id: string) => void | Promise<void>;
  onAddTaskToProject: (projectId: string) => void;
  onLogUpdate: (p: Project) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void | Promise<void>;
}) {
  const tCard = useTranslations("views.projects.card");
  const tDetail = useTranslations("views.projects.detail");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tPriority = useTranslations("priority");
  const tProjectModal = useTranslations("modals.project");
  const locale = useLocale();

  const projectTasks = tasks.filter((t) => t.projectId === p.id);
  const projectUpdates = updates.filter((u) => u.projectId === p.id);
  const done = projectTasks.filter((t) => t.done).length;
  const total = projectTasks.length;
  const StatusIcon = statusConfig[p.status]?.icon;

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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl h-[92vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <PrioritySelect
                value={p.priority}
                onChange={(priority) => onSaveProject({ priority })}
                tPriority={tPriority}
              />
              <InlineText
                value={p.name}
                onSave={(name) => onSaveProject({ name: name.trim() || p.name })}
                ariaLabel={tProjectModal("name")}
                className="text-xl sm:text-2xl font-bold text-zinc-100 truncate px-2 py-0.5 -mx-2"
                inputClassName="text-xl sm:text-2xl font-bold text-zinc-100 px-2 py-0.5 w-full max-w-md"
              />
              <StatusSelect
                value={p.status}
                onChange={(status) => onSaveProject({ status })}
                tStatus={tStatus}
                StatusIcon={StatusIcon}
              />
              <CategorySelect
                value={p.categoryId}
                categories={categories}
                onChange={(categoryId) => onSaveProject({ categoryId })}
                categoryById={categoryById}
                tProjectModal={tProjectModal}
              />
            </div>
            <div className="text-xs text-zinc-500">
              {total > 0 && (
                <span className="tabular-nums">
                  {done}/{total} {tCard("tasks").toLowerCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={async () => {
                await onDeleteProject(p.id);
                onClose();
              }}
              className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md flex items-center gap-1"
            >
              <Trash2 size={12} /> {tCommon("delete")}
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-md hover:bg-zinc-900 ml-1 transition-colors"
              aria-label={tCommon("close")}
              title={tDetail("closeTooltip")}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
            <div className="text-xs uppercase tracking-wider text-emerald-400 mb-1">
              {tCard("nextStep")}
            </div>
            <InlineText
              value={p.nextStep}
              onSave={(nextStep) => onSaveProject({ nextStep })}
              placeholder={tCard("nextStepEmpty")}
              ariaLabel={tCard("nextStep")}
              className="text-sm text-zinc-100 w-full px-1.5 py-1 -mx-1.5 block"
              inputClassName="text-sm text-zinc-100 w-full px-1.5 py-1"
            />
          </div>

          <ProjectSection title={tCard("whyMatters")}>
            <InlineTextarea
              value={p.why}
              onSave={(why) => onSaveProject({ why })}
              placeholder={tCard("whyEmpty")}
              ariaLabel={tCard("whyMatters")}
              className="text-sm text-zinc-300 px-1.5 py-1 -mx-1.5 block min-h-[1.5rem]"
              textareaClassName="text-sm text-zinc-200"
              rows={3}
            />
          </ProjectSection>

          <ProjectSection title={tCard("description")}>
            <InlineTextarea
              value={p.description}
              onSave={(description) => onSaveProject({ description })}
              placeholder={tCard("descriptionEmpty")}
              ariaLabel={tCard("description")}
              className="text-sm text-zinc-300 px-1.5 py-1 -mx-1.5 block min-h-[1.5rem]"
              textareaClassName="text-sm text-zinc-200"
              rows={4}
            />
          </ProjectSection>

          <ProjectSection
            title={tCard("tasks")}
            rightSlot={
              total > 0 ? (
                <span className="text-xs font-normal text-zinc-400 bg-zinc-800/80 border border-zinc-700 rounded-full px-2 py-0.5 tabular-nums">
                  {done}/{total}
                </span>
              ) : null
            }
          >
            <button
              onClick={() => onAddTaskToProject(p.id)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mb-2"
            >
              <Plus size={12} /> {tCard("addTask")}
            </button>
            {projectTasks.length === 0 ? (
              <div className="text-sm text-zinc-500 italic">
                {tCard("noTasks")}
              </div>
            ) : (
              <div className="space-y-1">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 group py-1"
                  >
                    <button
                      onClick={() => onToggleTask(task)}
                      className={`shrink-0 ${
                        task.done
                          ? "text-emerald-400"
                          : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        task.done
                          ? "line-through text-zinc-500"
                          : "text-zinc-200"
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-zinc-500">
                        {new Date(task.dueDate).toLocaleDateString(locale)}
                      </span>
                    )}
                    {task.effortHours != null && (
                      <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/15 text-blue-300 border-blue-500/30 inline-flex items-center gap-1">
                        <Clock size={10} />
                        {task.effortHours}h
                      </span>
                    )}
                    <button
                      onClick={() => onEditTask(task)}
                      className="text-zinc-600 hover:text-emerald-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      aria-label={tCard("editTaskAria")}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-zinc-600 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      aria-label={tCard("deleteTaskAria")}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ProjectSection>

          <ProjectSection
            title={tCard("recentActivity")}
            rightSlot={
              projectUpdates.length > 0 ? (
                <span className="text-xs font-normal text-zinc-400 bg-zinc-800/80 border border-zinc-700 rounded-full px-2 py-0.5 tabular-nums">
                  {projectUpdates.length}
                </span>
              ) : null
            }
          >
            <button
              onClick={() => onLogUpdate(p)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mb-2"
            >
              <Plus size={12} /> {tCard("logUpdate")}
            </button>
            <div className="space-y-1.5">
              {projectUpdates.map((u) => (
                <div
                  key={u.id}
                  className="text-sm text-zinc-400 flex flex-col sm:flex-row gap-0.5 sm:gap-2"
                >
                  <span className="text-zinc-600 text-xs shrink-0 sm:w-24">
                    {new Date(u.date).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="break-words min-w-0">{u.note}</span>
                </div>
              ))}
              {projectUpdates.length === 0 && (
                <div className="text-sm text-zinc-500 italic">
                  {tCard("noUpdates")}
                </div>
              )}
            </div>
          </ProjectSection>

          <ProjectSection
            title={tCard("notes")}
            rightSlot={
              notes.length > 0 ? (
                <span className="text-xs font-normal text-zinc-400 bg-zinc-800/80 border border-zinc-700 rounded-full px-2 py-0.5 tabular-nums">
                  {notes.length}
                </span>
              ) : null
            }
          >
            <NotesSection projectId={p.id} notes={notes} />
          </ProjectSection>
        </div>
      </div>
    </div>
  );
}

// ---------- Inline select chips for status / priority / category ----------

function StatusSelect({
  value,
  onChange,
  tStatus,
  StatusIcon,
}: {
  value: ProjectStatus;
  onChange: (next: ProjectStatus) => void;
  tStatus: ReturnType<typeof useTranslations>;
  StatusIcon: React.ComponentType<{ size?: number }> | undefined;
}) {
  return (
    <label
      className={`relative text-xs px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer hover:opacity-80 ${statusConfig[value]?.color}`}
    >
      {StatusIcon && <StatusIcon size={10} />}
      <span>{tStatus(value)}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProjectStatus)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={tStatus(value)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="bg-zinc-900 text-zinc-100">
            {tStatus(s)}
          </option>
        ))}
      </select>
    </label>
  );
}

function PrioritySelect({
  value,
  onChange,
  tPriority,
}: {
  value: Priority;
  onChange: (next: Priority) => void;
  tPriority: ReturnType<typeof useTranslations>;
}) {
  return (
    <label
      className="relative inline-flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
      title={tPriority(value)}
    >
      <span className="text-base leading-none">
        {priorityMeta(value).emoji}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Priority)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={tPriority(value)}
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value} className="bg-zinc-900 text-zinc-100">
            {p.emoji} {tPriority(p.value)}
          </option>
        ))}
      </select>
    </label>
  );
}

function CategorySelect({
  value,
  categories,
  onChange,
  categoryById,
  tProjectModal,
}: {
  value: string | null;
  categories: Category[];
  onChange: (next: string | null) => void;
  categoryById: Record<string, Category>;
  tProjectModal: ReturnType<typeof useTranslations>;
}) {
  const current = value ? categoryById[value] : null;
  const cls = current ? categoryColorClass(current.color).chip : "";

  return (
    <label
      className={`relative text-xs px-2 py-0.5 rounded border cursor-pointer hover:opacity-80 ${
        current
          ? cls
          : "bg-zinc-900 border-zinc-800 text-zinc-500 border-dashed"
      }`}
    >
      <span>{current ? current.name : tProjectModal("noCategory")}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={tProjectModal("category")}
      >
        <option value="" className="bg-zinc-900 text-zinc-100">
          {tProjectModal("noCategory")}
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-100">
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
