"use client";

import { useState } from "react";
import { Modal, Field } from "./ui";
import type { Project, Task } from "@/lib/types";

export function ProjectModal({
  project,
  onSave,
  onClose,
}: {
  project: Partial<Project> | null;
  onSave: (p: {
    id?: string;
    name: string;
    description: string;
    why: string;
    nextStep: string;
    status: string;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [why, setWhy] = useState(project?.why || "");
  const [nextStep, setNextStep] = useState(project?.nextStep || "");
  const [status, setStatus] = useState(project?.status || "idea");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      id: project?.id,
      name: name.trim(),
      description,
      why,
      nextStep,
      status,
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
  const [title, setTitle] = useState(task?.title || "");
  const [projectId, setProjectId] = useState(task?.projectId || "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.split("T")[0] : ""
  );

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      id: task?.id,
      title: title.trim(),
      projectId: projectId || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
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
