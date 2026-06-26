"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { ChevronDown, Lock, Search, X as XIcon } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import { TimeOfDayField } from "../ui/TimeOfDayField";
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
    dueTime: string | null;
    durationMinutes: number | null;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.task");
  const tCommon = useTranslations("common");
  const tTime = useTranslations("modals.timeOfDay");
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
  // Time-of-day is optional: "" = all-day. Stored time comes back as "HH:MM:SS".
  const [dueTime, setDueTime] = useState((task?.dueTime ?? "").slice(0, 5));
  const [durationMinutes, setDurationMinutes] = useState(
    task?.durationMinutes ?? 30
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
    const timed = dueDate !== "" && dueTime !== "";
    onSave({
      id: task?.id,
      title: title.trim(),
      projectId: projectId || null,
      dueDate: dueDate ? inputDateToIso(dueDate) : null,
      done: task?.done || false,
      effortHours: Number.isFinite(parsedEffort) ? parsedEffort : null,
      dueTime: timed ? dueTime : null,
      durationMinutes: timed ? durationMinutes : null,
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
        {dueDate && (
          <Field label={tTime("label")}>
            <TimeOfDayField
              time={dueTime}
              minutes={durationMinutes}
              onChangeTime={setDueTime}
              onChangeMinutes={setDurationMinutes}
            />
          </Field>
        )}
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
                {blockers.map((b) => {
                  const found = b.blockingTaskId
                    ? tasks.find((t2) => t2.id === b.blockingTaskId)
                    : null;
                  const proj = found?.projectId
                    ? projects.find((p) => p.id === found.projectId)
                    : null;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 text-sm bg-border/40 rounded-lg px-3 py-1.5"
                    >
                      <Lock size={12} className="text-text-muted shrink-0" />
                      <span className="flex-1 flex items-center gap-1.5 min-w-0 text-text-muted">
                        {b.blockingTaskId ? (
                          <>
                            {proj && (
                              <span className="shrink-0 text-[10px] bg-border border border-border rounded px-1.5 py-0.5 font-medium">
                                {proj.name}
                              </span>
                            )}
                            <span className="truncate min-w-0">
                              {found?.title ?? t("unknownTask")}
                            </span>
                          </>
                        ) : (
                          <span className="truncate min-w-0">{b.externalDescription}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlocker(b.id)}
                        className="text-text-muted hover:text-red-400 shrink-0"
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {availableBlockerTasks.length > 0 && (
              <div className="flex gap-2">
                <BlockerTaskCombobox
                  tasks={availableBlockerTasks}
                  projects={projects}
                  value={blockerTaskId}
                  onChange={setBlockerTaskId}
                  placeholder={t("selectBlockingTask")}
                />
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

function BlockerTaskCombobox({
  tasks,
  projects,
  value,
  onChange,
  placeholder,
}: {
  tasks: Task[];
  projects: Project[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Posición fija calculada del botón. El menú se portaliza a <body> para no
  // quedar recortado por el `overflow-y-auto` del Modal (ver Modal.tsx).
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
    placement: "down" | "up";
  } | null>(null);

  const updatePosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(320, Math.max(160, openUp ? spaceAbove : spaceBelow));
    setPos({
      left: r.left,
      top: openUp ? r.top - margin : r.bottom + 4,
      width: r.width,
      maxHeight,
      placement: openUp ? "up" : "down",
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    // capture=true para reaccionar al scroll de cualquier ancestro (el modal).
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const selectedTask = tasks.find((t) => t.id === value) ?? null;
  const selectedProject = selectedTask?.projectId
    ? projects.find((p) => p.id === selectedTask.projectId) ?? null
    : null;

  const groups = useMemo(() => {
    const q = query.toLowerCase();
    const matched = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)) : tasks;
    const byProject = new Map<string | null, Task[]>();
    for (const task of matched) {
      const key = task.projectId ?? null;
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(task);
    }
    const result: { id: string | null; name: string | null; tasks: Task[] }[] = [];
    for (const p of projects) {
      const pTasks = byProject.get(p.id);
      if (pTasks?.length) result.push({ id: p.id, name: p.name, tasks: pTasks });
    }
    const unassigned = byProject.get(null);
    if (unassigned?.length) result.push({ id: null, name: null, tasks: unassigned });
    return result;
  }, [tasks, projects, query]);

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 bg-border border border-border rounded-lg px-3 py-2 text-sm text-left"
      >
        {selectedTask ? (
          <>
            {selectedProject && (
              <span className="shrink-0 text-[10px] bg-bg border border-border rounded px-1.5 py-0.5 font-medium text-text-muted">
                {selectedProject.name}
              </span>
            )}
            <span className="flex-1 min-w-0 truncate text-text">{selectedTask.title}</span>
          </>
        ) : (
          <span className="flex-1 min-w-0 truncate text-text-muted">{placeholder}</span>
        )}
        <ChevronDown size={14} className="text-text-muted shrink-0" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[60] bg-surface border border-border rounded-lg shadow-lg overflow-hidden flex flex-col"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: pos.maxHeight,
              transform: pos.placement === "up" ? "translateY(-100%)" : undefined,
            }}
          >
            <div className="p-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2 bg-border rounded-lg px-2 py-1.5">
                <Search size={13} className="text-text-muted shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setOpen(false);
                      setQuery("");
                    }
                  }}
                />
              </div>
            </div>
            <div className="overflow-y-auto">
              {groups.length === 0 ? (
                <div className="px-3 py-4 text-sm text-text-muted text-center">Sin resultados</div>
              ) : (
                groups.map((g) => (
                  <div key={g.id ?? "__none__"}>
                    <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-text-muted sticky top-0 bg-surface">
                      {g.name ?? "Sin proyecto"}
                    </div>
                    {g.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          onChange(task.id);
                          setOpen(false);
                          setQuery("");
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm truncate ${
                          task.id === value ? "bg-accent text-bg" : "text-text hover:bg-border"
                        }`}
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
