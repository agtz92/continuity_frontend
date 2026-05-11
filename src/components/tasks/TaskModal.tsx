"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import type { Project, Task } from "@/lib/types";

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
    effortHours: number | null;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.task");
  const tCommon = useTranslations("common");

  const isoToInputDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const inputDateToIso = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0).toISOString();
  };

  const [title, setTitle] = useState(task?.title || "");
  const [projectId, setProjectId] = useState(task?.projectId || "");
  const [dueDate, setDueDate] = useState(isoToInputDate(task?.dueDate));
  const [effortHours, setEffortHours] = useState(
    task?.effortHours != null ? String(task.effortHours) : ""
  );

  const handleSubmit = () => {
    if (!title.trim()) return;
    const parsedEffort = effortHours.trim() ? parseFloat(effortHours) : NaN;
    onSave({
      id: task?.id,
      title: title.trim(),
      projectId: projectId || null,
      dueDate: dueDate ? inputDateToIso(dueDate) : null,
      done: task?.done || false,
      effortHours: Number.isFinite(parsedEffort) ? parsedEffort : null,
    });
  };

  const adjustEffort = (delta: number) => {
    const current = parseFloat(effortHours);
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, Math.round((base + delta) * 2) / 2);
    setEffortHours(String(next));
  };

  return (
    <Modal title={task?.id ? t("editTitle") : t("newTitle")} onClose={onClose}>
      <div className="space-y-3">
        <Field label={t("titleField")}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
        </Field>
        <Field label={t("project")}>
          <select
            value={projectId || ""}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t("noProject")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("dueDate")}>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("effort")}>
          <div className="flex items-stretch gap-2">
            <input
              type="number"
              step="0.5"
              min="0"
              value={effortHours}
              onChange={(e) => setEffortHours(e.target.value)}
              placeholder={t("effortPlaceholder")}
              className="no-spinner flex-1 bg-border border border-border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => adjustEffort(-0.5)}
              className="px-3 bg-border hover:opacity-80 border border-border rounded-lg text-text-muted"
              aria-label={t("decreaseEffortAria")}
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={() => adjustEffort(0.5)}
              className="px-3 bg-border hover:opacity-80 border border-border rounded-lg text-text-muted"
              aria-label={t("increaseEffortAria")}
            >
              <Plus size={14} />
            </button>
          </div>
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
