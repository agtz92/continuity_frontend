"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { Lock, X as XIcon } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { todayLocalISODate, toLocalISO } from "@/lib/date";
import { ADD_TASK_BLOCKER, DASHBOARD_QUERY, REMOVE_TASK_BLOCKER } from "@/lib/graphql";
import type { Project, Task, TaskBlocker } from "@/lib/types";

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
  tasks,
  onSave,
  onClose,
}: {
  task: Partial<Task> | null;
  projects: Project[];
  tasks: Task[];
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
  const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };
  const [addBlockerMutation] = useMutation(ADD_TASK_BLOCKER, refetchAfter);
  const [removeBlockerMutation] = useMutation(REMOVE_TASK_BLOCKER, refetchAfter);
  const [blockers, setBlockers] = useState<TaskBlocker[]>(task?.blockers ?? []);
  const [blockerTaskId, setBlockerTaskId] = useState("");
  const [externalBlocker, setExternalBlocker] = useState("");

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

  const handleAddTaskBlocker = async () => {
    if (!task?.id || !blockerTaskId) return;
    try {
      const result = await addBlockerMutation({
        variables: { data: { blockedTaskId: task.id, blockingTaskId: blockerTaskId } },
      });
      if (result.data?.addTaskBlocker) {
        setBlockers((prev) => [...prev, result.data.addTaskBlocker]);
        setBlockerTaskId("");
      }
    } catch {
      /* errorLink toasts */
    }
  };

  const handleAddExternalBlocker = async () => {
    if (!task?.id || !externalBlocker.trim()) return;
    try {
      const result = await addBlockerMutation({
        variables: { data: { blockedTaskId: task.id, externalDescription: externalBlocker.trim() } },
      });
      if (result.data?.addTaskBlocker) {
        setBlockers((prev) => [...prev, result.data.addTaskBlocker]);
        setExternalBlocker("");
      }
    } catch {
      /* errorLink toasts */
    }
  };

  const handleRemoveBlocker = async (blockerId: string) => {
    try {
      await removeBlockerMutation({ variables: { id: blockerId } });
      setBlockers((prev) => prev.filter((b) => b.id !== blockerId));
    } catch {
      /* errorLink toasts */
    }
  };

  const availableBlockerTasks = tasks.filter(
    (t2) => t2.id !== task?.id && !t2.done && !blockers.some((b) => b.blockingTaskId === t2.id)
  );

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
        {task?.id && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wide">
              {t("blockers")}
            </div>
            {blockers.length > 0 && (
              <div className="space-y-1">
                {blockers.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 text-sm bg-border/40 rounded-lg px-3 py-1.5"
                  >
                    <Lock size={12} className="text-text-muted shrink-0" />
                    <span className="flex-1 text-text-muted truncate">
                      {b.blockingTaskId
                        ? (tasks.find((t2) => t2.id === b.blockingTaskId)?.title ?? t("unknownTask"))
                        : b.externalDescription}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlocker(b.id)}
                      className="text-text-muted hover:text-red-400 shrink-0"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {availableBlockerTasks.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={blockerTaskId}
                  onChange={(e) => setBlockerTaskId(e.target.value)}
                  className="flex-1 bg-border border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{t("selectBlockingTask")}</option>
                  {availableBlockerTasks.map((t2) => (
                    <option key={t2.id} value={t2.id}>
                      {t2.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddTaskBlocker}
                  disabled={!blockerTaskId}
                  className="px-3 py-2 bg-border border border-border rounded-lg text-sm disabled:opacity-50 hover:opacity-80"
                >
                  {t("addBlocker")}
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={externalBlocker}
                onChange={(e) => setExternalBlocker(e.target.value)}
                placeholder={t("externalBlockerPlaceholder")}
                className="flex-1 bg-border border border-border rounded-lg px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExternalBlocker();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddExternalBlocker}
                disabled={!externalBlocker.trim()}
                className="px-3 py-2 bg-border border border-border rounded-lg text-sm disabled:opacity-50 hover:opacity-80"
              >
                {t("addBlocker")}
              </button>
            </div>
          </div>
        )}
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
