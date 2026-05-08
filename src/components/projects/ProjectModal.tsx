"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import type { Category, Priority, Project } from "@/lib/types";
import {
  CATEGORY_COLORS,
  PRIORITIES,
  categoryColorClass,
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
      <div className="flex flex-col gap-3 flex-1 min-h-0">
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
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>
        <Field label="Description" grow>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-y flex-1 min-h-[60px]"
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
