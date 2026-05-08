"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal, Field } from "./ui";
import type { Category, Priority, Project, Task } from "@/lib/types";
import {
  CATEGORY_COLORS,
  PRIORITIES,
  categoryColorClass,
  priorityMeta,
} from "@/lib/types";

export function ProjectModal({
  project,
  categories,
  onSave,
  onCreateCategory,
  onClose,
}: {
  project: Partial<Project> | null;
  categories: Category[];
  onSave: (p: {
    id?: string;
    name: string;
    description: string;
    why: string;
    nextStep: string;
    status: string;
    priority: Priority;
    categoryId: string | null;
  }) => void | Promise<void>;
  onCreateCategory: (input: {
    name: string;
    color: string;
  }) => Promise<Category | null>;
  onClose: () => void;
}) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [why, setWhy] = useState(project?.why || "");
  const [nextStep, setNextStep] = useState(project?.nextStep || "");
  const [status, setStatus] = useState<string>(project?.status || "idea");
  const [priority, setPriority] = useState<Priority>(project?.priority || "medium");
  const [categoryId, setCategoryId] = useState<string | null>(
    project?.categoryId ?? null
  );
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState<string>("emerald");

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const cat = await onCreateCategory({
      name: newCatName.trim(),
      color: newCatColor,
    });
    if (cat) {
      setCategoryId(cat.id);
      setCreatingCategory(false);
      setNewCatName("");
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      id: project?.id,
      name: name.trim(),
      description,
      why,
      nextStep,
      status,
      priority,
      categoryId,
    });
  };

  return (
    <Modal title={project?.id ? "Edit Project" : "New Project"} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
        </Field>
        <Field label="Why does this matter?">
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={2}
            placeholder="Your motivation — comes back when stalled."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </Field>
        <Field label="Next step">
          <input
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="The very next concrete action"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="idea">Idea</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="launched">Launched</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.emoji} {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Category">
          {!creatingCategory ? (
            <div className="flex gap-2">
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCreatingCategory(true)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs flex items-center gap-1"
              >
                <Plus size={12} /> New
              </button>
            </div>
          ) : (
            <div className="space-y-2 bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-sm"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_COLORS.map((c) => {
                  const cls = categoryColorClass(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${cls.dot} ${
                        newCatColor === c ? "border-white" : "border-transparent"
                      }`}
                      title={c}
                    />
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-md text-xs font-medium"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingCategory(false);
                    setNewCatName("");
                  }}
                  className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Field>
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function CategoryManagementModal({
  categories,
  onDelete,
  onClose,
}: {
  categories: Category[];
  onDelete: (id: string) => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal title="Manage categories" onClose={onClose}>
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-sm text-zinc-500 italic text-center py-6">
            No categories yet. Create one from a project.
          </div>
        ) : (
          <div className="space-y-1.5">
            {categories.map((c) => {
              const cls = categoryColorClass(c.color);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2"
                >
                  <span className={`w-3 h-3 rounded-full ${cls.dot}`} />
                  <span className="flex-1 text-sm">{c.name}</span>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-zinc-500 hover:text-red-400 p-1"
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-zinc-500">
          Deleting a category leaves its projects intact (just uncategorized).
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export function TaskModal({
  task,
  projects,
  onSave,
  onClose,
}: {
  task: Partial<Task> | null;
  projects: Project[];
  onSave: (t: {
    id?: string;
    title: string;
    projectId: string | null;
    dueDate: string | null;
    done: boolean;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const isoToInputDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const inputDateToIso = (s: string) => {
    // Build a Date at LOCAL midnight (no Z) so the user's calendar day is preserved.
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0).toISOString();
  };

  const [title, setTitle] = useState(task?.title || "");
  const [projectId, setProjectId] = useState(task?.projectId || "");
  const [dueDate, setDueDate] = useState(isoToInputDate(task?.dueDate));

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      id: task?.id,
      title: title.trim(),
      projectId: projectId || null,
      dueDate: dueDate ? inputDateToIso(dueDate) : null,
      done: task?.done || false,
    });
  };

  return (
    <Modal title={task?.id ? "Edit Task" : "New Task"} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Title *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
        </Field>
        <Field label="Project">
          <select
            value={projectId || ""}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          />
        </Field>
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function IdeaModal({
  onSave,
  onClose,
}: {
  onSave: (i: { title: string; description: string }) => void | Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description });
  };

  return (
    <Modal title="Capture Idea" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          Park it here so it doesn't pull you off your current work.
        </p>
        <Field label="Idea *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
        </Field>
        <Field label="Notes">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </Field>
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm"
          >
            Capture
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function UpdateModal({
  projectName,
  onSave,
  onClose,
}: {
  projectName: string;
  onSave: (note: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!note.trim()) return;
    onSave(note.trim());
  };

  return (
    <Modal title={`Log update — ${projectName}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="What happened?">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g., Finished the landing page wireframe"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none"
            autoFocus
          />
        </Field>
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm"
          >
            Log it
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
