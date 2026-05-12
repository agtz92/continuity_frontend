"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
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
    dueDate: string | null;
  }) => void | Promise<void>;
  onCreateCategory: (input: {
    name: string;
    color: string;
  }) => Promise<Category | null>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.project");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tPriority = useTranslations("priority");
  const tTask = useTranslations("modals.task");

  const isoToInputDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const inputDateToIso = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0).toISOString();
  };

  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [why, setWhy] = useState(project?.why || "");
  const [nextStep, setNextStep] = useState(project?.nextStep || "");
  const [status, setStatus] = useState<string>(project?.status || "idea");
  const [priority, setPriority] = useState<Priority>(project?.priority || "medium");
  const [categoryId, setCategoryId] = useState<string | null>(
    project?.categoryId ?? null
  );
  const [dueDate, setDueDate] = useState(isoToInputDate(project?.dueDate));
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
      dueDate: dueDate ? inputDateToIso(dueDate) : null,
    });
  };

  return (
    <Modal title={project?.id ? t("editTitle") : t("newTitle")} onClose={onClose}>
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <Field label={t("name")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
        </Field>
        <Field label={t("why")}>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={2}
            placeholder={t("whyPlaceholder")}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>
        <Field label={t("description")}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={3}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>
        <Field label={t("nextStep")}>
          <input
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder={t("nextStepPlaceholder")}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("status")}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="idea">{tStatus("idea")}</option>
              <option value="active">{tStatus("active")}</option>
              <option value="paused">{tStatus("paused")}</option>
              <option value="launched">{tStatus("launched")}</option>
              <option value="archived">{tStatus("archived")}</option>
            </select>
          </Field>
          <Field label={t("priority")}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.emoji} {tPriority(p.value)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={tTask("dueDate")}>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("category")}>
          {!creatingCategory ? (
            <div className="flex gap-2">
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="flex-1 bg-border border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{t("noCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCreatingCategory(true)}
                className="px-3 py-2 bg-border hover:opacity-80 border border-border rounded-lg text-xs flex items-center gap-1"
              >
                <Plus size={12} /> {tCommon("new")}
              </button>
            </div>
          ) : (
            <div className="space-y-2 bg-border/50 border border-border rounded-lg p-2.5">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={t("newCategoryName")}
                className="w-full bg-border border border-border rounded-md px-2 py-1.5 text-sm"
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
                  className="flex-1 px-2 py-1.5 bg-accent hover:opacity-90 text-bg rounded-md text-xs font-medium"
                >
                  {t("createCategory")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingCategory(false);
                    setNewCatName("");
                  }}
                  className="px-2 py-1.5 bg-border hover:bg-text-muted rounded-md text-xs"
                >
                  {tCommon("cancel")}
                </button>
              </div>
            </div>
          )}
        </Field>
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm"
          >
            {tCommon("save")}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm"
          >
            {tCommon("cancel")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
