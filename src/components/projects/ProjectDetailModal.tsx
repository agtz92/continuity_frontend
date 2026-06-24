"use client";

import { useEffect } from "react";
import {
  Calendar,
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
  Activity,
  Priority,
  Project,
  ProjectNote,
  ProjectStatus,
  Task,
} from "@/lib/types";
import { PRIORITIES, categoryColorClass } from "@/lib/types";
import { priorityStripeClass } from "@/lib/priority";
import { statusConfig } from "@/lib/status";
import { NotesSection } from "@/components/projects/notes/NotesSection";
import { ProjectClosureNotes } from "@/components/projects/ProjectClosureNotes";
import { ProjectSection } from "@/components/projects/ProjectSection";
import { ShowMoreList } from "@/components/ui/ShowMoreList";
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
  "killed",
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
  activities,
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
  activities: Activity[];
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
  const projectUpdates = activities.filter(
    (a) => a.kind === "note" && a.projectId === p.id
  );
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
      <div className="relative w-full max-w-5xl h-[92vh] bg-bg border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-border shrink-0">
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
                className="text-xl sm:text-2xl font-bold text-text truncate px-2 py-0.5 -mx-2"
                inputClassName="text-xl sm:text-2xl font-bold text-text px-2 py-0.5 w-full max-w-md"
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
              <DueDateSelect
                value={p.dueDate}
                onChange={(dueDate) => onSaveProject({ dueDate })}
                locale={locale}
                label={tDetail("dueDate")}
                emptyLabel={tDetail("noDueDate")}
                clearLabel={tDetail("clearDueDate")}
              />
            </div>
            <div className="text-xs text-text-muted">
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
              className="text-text-muted hover:text-text p-1.5 rounded-md hover:bg-surface ml-1 transition-colors"
              aria-label={tCommon("close")}
              title={tDetail("closeTooltip")}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          <div className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
            <div className="text-xs uppercase tracking-wider text-accent mb-1">
              {tCard("nextStep")}
            </div>
            <InlineText
              value={p.nextStep}
              onSave={(nextStep) => onSaveProject({ nextStep })}
              placeholder={tCard("nextStepEmpty")}
              ariaLabel={tCard("nextStep")}
              className="text-sm text-text w-full px-1.5 py-1 -mx-1.5 block"
              inputClassName="text-sm text-text w-full px-1.5 py-1"
            />
          </div>

          {(p.status === "paused" || p.status === "killed") && (
            <div
              className={`rounded-lg border px-3 py-3 ${
                p.status === "killed"
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-slate-500/30 bg-slate-500/10"
              }`}
            >
              <ProjectClosureNotes project={p} />
            </div>
          )}

          <ProjectSection title={tCard("whyMatters")}>
            <InlineTextarea
              value={p.why}
              onSave={(why) => onSaveProject({ why })}
              placeholder={tCard("whyEmpty")}
              ariaLabel={tCard("whyMatters")}
              className="text-sm text-text-muted px-1.5 py-1 -mx-1.5 block min-h-[1.5rem]"
              textareaClassName="text-sm text-text"
              rows={3}
            />
          </ProjectSection>

          <ProjectSection title={tCard("description")}>
            <InlineTextarea
              value={p.description}
              onSave={(description) => onSaveProject({ description })}
              placeholder={tCard("descriptionEmpty")}
              ariaLabel={tCard("description")}
              className="text-sm text-text-muted px-1.5 py-1 -mx-1.5 block min-h-[1.5rem]"
              textareaClassName="text-sm text-text"
              rows={4}
            />
          </ProjectSection>

          <ProjectSection
            title={tCard("tasks")}
            rightSlot={
              total > 0 ? (
                <span className="text-xs font-normal text-text-muted bg-border/80 border border-border rounded-full px-2 py-0.5 tabular-nums">
                  {done}/{total}
                </span>
              ) : null
            }
          >
            <button
              onClick={() => onAddTaskToProject(p.id)}
              className="text-xs text-accent hover:text-accent flex items-center gap-1 mb-2"
            >
              <Plus size={12} /> {tCard("addTask")}
            </button>
            {projectTasks.length === 0 ? (
              <div className="text-sm text-text-muted italic">
                {tCard("noTasks")}
              </div>
            ) : (() => {
              const pendingTasks = projectTasks.filter((tk) => !tk.done);
              const doneTasks = projectTasks
                .filter((tk) => tk.done)
                .sort((a, b) =>
                  (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
                );
              const renderTaskRow = (task: Task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 group py-1"
                >
                  <button
                    onClick={() => onToggleTask(task)}
                    className={`shrink-0 ${
                      task.done
                        ? "text-accent"
                        : "text-text-muted hover:text-text-muted"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <span
                    className={`text-sm flex-1 ${
                      task.done
                        ? "line-through text-text-muted"
                        : "text-text"
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-text-muted">
                      {new Date(task.dueDate).toLocaleDateString(locale)}
                    </span>
                  )}
                  {task.effortHours != null && (
                    <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
                      <Clock size={10} />
                      {task.effortHours}h
                    </span>
                  )}
                  <button
                    onClick={() => onEditTask(task)}
                    className="text-text-muted hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label={tCard("editTaskAria")}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="text-text-muted hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label={tCard("deleteTaskAria")}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
              return (
                <div className="space-y-1">
                  {pendingTasks.map(renderTaskRow)}
                  <ShowMoreList
                    items={doneTasks}
                    initialCount={5}
                    renderItem={renderTaskRow}
                    itemKey={(task) => task.id}
                  />
                </div>
              );
            })()}
          </ProjectSection>

          <ProjectSection
            title={tCard("recentActivity")}
            rightSlot={
              projectUpdates.length > 0 ? (
                <span className="text-xs font-normal text-text-muted bg-border/80 border border-border rounded-full px-2 py-0.5 tabular-nums">
                  {projectUpdates.length}
                </span>
              ) : null
            }
          >
            <button
              onClick={() => onLogUpdate(p)}
              className="text-xs text-accent hover:text-accent flex items-center gap-1 mb-2"
            >
              <Plus size={12} /> {tCard("logUpdate")}
            </button>
            <div className="space-y-1.5">
              {projectUpdates.length === 0 ? (
                <div className="text-sm text-text-muted italic">
                  {tCard("noUpdates")}
                </div>
              ) : (
                <ShowMoreList
                  items={[...projectUpdates].sort((a, b) =>
                    (b.created ?? "").localeCompare(a.created ?? "")
                  )}
                  initialCount={5}
                  renderItem={(a) => (
                    <div
                      key={a.id}
                      className="text-sm text-text-muted flex flex-col sm:flex-row gap-0.5 sm:gap-2"
                    >
                      <span className="text-text-muted text-xs shrink-0 sm:w-24">
                        {new Date(a.created).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
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

          <ProjectSection
            title={tCard("notes")}
            rightSlot={
              notes.length > 0 ? (
                <span className="text-xs font-normal text-text-muted bg-border/80 border border-border rounded-full px-2 py-0.5 tabular-nums">
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
          <option key={s} value={s} className="bg-surface text-text">
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
      <span className={`w-3 h-3 rounded-full ${priorityStripeClass[value]}`} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Priority)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={tPriority(value)}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p} className="bg-surface text-text">
            {tPriority(p)}
          </option>
        ))}
      </select>
    </label>
  );
}

function DueDateSelect({
  value,
  onChange,
  locale,
  label,
  emptyLabel,
  clearLabel,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  locale: string;
  label: string;
  emptyLabel: string;
  clearLabel: string;
}) {
  const isoToInputDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const inputDateToIso = (s: string) => {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0).toISOString();
  };
  const display = value
    ? new Date(value).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : emptyLabel;

  return (
    <label
      className={`relative text-xs px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer hover:opacity-80 ${
        value
          ? "bg-surface border-border text-text"
          : "bg-surface border-border text-text-muted border-dashed"
      }`}
      title={label}
    >
      <Calendar size={10} />
      <span>{display}</span>
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(null);
          }}
          className="relative z-10 ml-0.5 text-text-muted hover:text-red-400"
          aria-label={clearLabel}
        >
          <X size={10} />
        </button>
      )}
      <input
        type="date"
        value={isoToInputDate(value)}
        onChange={(e) => onChange(inputDateToIso(e.target.value))}
        onClick={(e) => {
          const el = e.currentTarget as HTMLInputElement & {
            showPicker?: () => void;
          };
          try {
            el.showPicker?.();
          } catch {
            /* showPicker unsupported / not allowed — fall back to native focus */
          }
        }}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={label}
      />
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
          : "bg-surface border-border text-text-muted border-dashed"
      }`}
    >
      <span>{current ? current.name : tProjectModal("noCategory")}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={tProjectModal("category")}
      >
        <option value="" className="bg-surface text-text">
          {tProjectModal("noCategory")}
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id} className="bg-surface text-text">
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
