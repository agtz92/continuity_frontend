"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Project } from "@/lib/types";

export type TaskFilterDraft = {
  /** Project IDs to include; `null` element represents "no project". Empty set = no filter. */
  projectIds: ReadonlySet<string | null>;
  showCompleted: boolean;
  showBlocked: boolean;
};

export const EMPTY_TASK_FILTER: TaskFilterDraft = {
  projectIds: new Set(),
  showCompleted: true,
  showBlocked: true,
};

export function TasksFilterSheet({
  open,
  initial,
  projects,
  hasUnassigned,
  previewCount,
  onApply,
  onClose,
}: {
  open: boolean;
  initial: TaskFilterDraft;
  projects: Project[];
  /** Whether any task without a project exists — controls the "Sin proyecto" chip visibility. */
  hasUnassigned: boolean;
  previewCount: (draft: TaskFilterDraft) => number;
  onApply: (draft: TaskFilterDraft) => void;
  onClose: () => void;
}) {
  const tSheet = useTranslations("views.tasks.filterSheet");

  const [draft, setDraft] = useState<TaskFilterDraft>(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  if (!open) return null;

  const toggleProject = (id: string | null) => {
    setDraft((d) => {
      const next = new Set(d.projectIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...d, projectIds: next };
    });
  };

  const count = previewCount(draft);

  return (
    <BottomSheet
      title={tSheet("title")}
      onClose={onClose}
      initialHeight="auto"
      footer={
        <button
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          disabled={count === 0}
          className="w-full px-4 py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm"
        >
          {count === 0 ? tSheet("applyEmpty") : tSheet("apply", { count })}
        </button>
      }
    >
      <div className="flex items-center justify-end -mt-1 mb-2">
        <button
          type="button"
          onClick={() => setDraft(EMPTY_TASK_FILTER)}
          className="text-xs text-accent hover:opacity-80 px-2 py-1"
        >
          {tSheet("clear")}
        </button>
      </div>

      <div className="space-y-4">
        {(projects.length > 0 || hasUnassigned) && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-text-muted mb-2">
              {tSheet("byProject")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hasUnassigned && (
                <ProjectChip
                  active={draft.projectIds.has(null)}
                  label={tSheet("noProject")}
                  onClick={() => toggleProject(null)}
                />
              )}
              {projects.map((p) => (
                <ProjectChip
                  key={p.id}
                  active={draft.projectIds.has(p.id)}
                  label={p.name}
                  onClick={() => toggleProject(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center justify-between gap-3 cursor-pointer px-1 py-2">
          <span className="text-sm text-text">{tSheet("showCompleted")}</span>
          <input
            type="checkbox"
            checked={draft.showCompleted}
            onChange={(e) =>
              setDraft((d) => ({ ...d, showCompleted: e.target.checked }))
            }
            className="w-5 h-5 accent-accent"
          />
        </label>
        <label className="flex items-center justify-between gap-3 cursor-pointer px-1 py-2">
          <span className="text-sm text-text">{tSheet("showBlocked")}</span>
          <input
            type="checkbox"
            checked={draft.showBlocked}
            onChange={(e) =>
              setDraft((d) => ({ ...d, showBlocked: e.target.checked }))
            }
            className="w-5 h-5 accent-accent"
          />
        </label>
      </div>
    </BottomSheet>
  );
}

function ProjectChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
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
