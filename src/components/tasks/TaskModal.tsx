"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { todayLocalISODate, toLocalISO } from "@/lib/date";
import type { Project, Task } from "@/lib/types";

const HOUR_PRESETS = [0.25, 0.5, 1, 2, 4] as const;

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return toLocalISO(date);
}

function upcomingFridayISO(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 5=Fri
  const daysAhead = (5 - dayOfWeek + 7) % 7 || 7; // if today is Fri, jump to next Fri
  const target = new Date(today);
  target.setDate(today.getDate() + daysAhead);
  return toLocalISO(target);
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
    effortHours: number | null;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.task");
  const tCommon = useTranslations("common");
  const autoFocus = useAutoFocus();

  const isoToInputDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return toLocalISO(d);
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

  const datePresets = useMemo(() => {
    const today = todayLocalISODate();
    return {
      today,
      tomorrow: addDays(today, 1),
      friday: upcomingFridayISO(),
    };
  }, []);

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

  const setDueChip = (iso: string) => {
    setDueDate((current) => (current === iso ? "" : iso));
  };

  const setHourChip = (h: number) => {
    setEffortHours((current) => (current === String(h) ? "" : String(h)));
  };

  const currentEffort = effortHours.trim();
  const canSubmit = title.trim().length > 0;

  return (
    <Modal
      title={task?.id ? t("editTitle") : t("newTitle")}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm"
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
      }
    >
      <div className="space-y-3">
        <Field label={t("titleField")}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            autoFocus={autoFocus}
            enterKeyHint="next"
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
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <DateChip
                label={t("chips.today")}
                active={dueDate === datePresets.today}
                onClick={() => setDueChip(datePresets.today)}
              />
              <DateChip
                label={t("chips.tomorrow")}
                active={dueDate === datePresets.tomorrow}
                onClick={() => setDueChip(datePresets.tomorrow)}
              />
              <DateChip
                label={t("chips.thisWeek")}
                active={dueDate === datePresets.friday}
                onClick={() => setDueChip(datePresets.friday)}
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-border text-text-muted hover:opacity-80"
                >
                  {t("chips.clear")}
                </button>
              )}
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </Field>
        <Field label={t("effort")}>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {HOUR_PRESETS.map((h) => (
                <DateChip
                  key={h}
                  label={`${h}h`}
                  active={currentEffort === String(h)}
                  onClick={() => setHourChip(h)}
                />
              ))}
              {currentEffort && !HOUR_PRESETS.some((h) => String(h) === currentEffort) && (
                <button
                  type="button"
                  onClick={() => setEffortHours("")}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-border text-text-muted hover:opacity-80"
                >
                  {t("chips.clear")}
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.5"
              min="0"
              value={effortHours}
              onChange={(e) => setEffortHours(e.target.value)}
              placeholder={t("effortPlaceholder")}
              className="no-spinner w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </Field>
      </div>
    </Modal>
  );
}

function DateChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? "bg-accent text-bg border-accent"
          : "bg-border text-text-muted border-border hover:opacity-80"
      }`}
    >
      {label}
    </button>
  );
}
