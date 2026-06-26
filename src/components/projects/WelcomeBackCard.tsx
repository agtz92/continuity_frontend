"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, Undo2, Zap } from "lucide-react";
import { Modal } from "../ui/Modal";
import { ProjectClosureNotes } from "./ProjectClosureNotes";
import { daysSince } from "@/lib/date";
import type { Project } from "@/lib/types";

/**
 * Shown when the user opens a paused project. Surfaces the closure notes they
 * wrote (context / next action / blocker) and offers Reactivate vs Keep paused.
 *
 * When the project was paused its open tasks had their due dates parked
 * (state-closure). On reactivation we don't auto-restore them (suggest, not
 * auto): if any tasks were parked, the card lets the user choose to restore the
 * original dates or leave them unscheduled, defaulting to unscheduled.
 *
 * Copy is verbatim from the State Closure spec — do not paraphrase.
 */
export function WelcomeBackCard({
  project,
  parkedTaskCount = 0,
  nextParkedDate = null,
  onReactivate,
  onClose,
}: {
  project: Project;
  /** How many of the project's tasks have a parked due-date snapshot. */
  parkedTaskCount?: number;
  /** Soonest parked due date (ISO), for the hint line. */
  nextParkedDate?: string | null;
  /**
   * Saves status=active and applies the reschedule choice (restoreDates=true →
   * re-apply original dates; false → leave unscheduled). Resolves true on
   * success; parent closes.
   */
  onReactivate: (restoreDates: boolean) => Promise<boolean>;
  /** Keep paused: close, read-only. */
  onClose: () => void;
}) {
  const t = useTranslations("views.closure.welcomeBack");
  const [saving, setSaving] = useState(false);
  // Suggest, not auto: default to leaving tasks unscheduled.
  const [restoreDates, setRestoreDates] = useState(false);
  const days = daysSince(project.pausedAt ?? project.lastActivity) ?? 0;
  const hasParked = parkedTaskCount > 0;
  const nextDateLabel = nextParkedDate
    ? new Date(nextParkedDate).toLocaleDateString()
    : null;

  const handleReactivate = async () => {
    if (saving) return;
    setSaving(true);
    const ok = await onReactivate(hasParked && restoreDates);
    setSaving(false);
    if (!ok) return; // errorLink already toasted
  };

  return (
    <Modal
      title={t("title", { name: project.name })}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-muted text-center">{t("ready")}</p>
          <div className="flex gap-2">
            <button
              onClick={handleReactivate}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm flex items-center justify-center gap-1.5"
            >
              <Zap size={14} /> {t("reactivate")}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm"
            >
              {t("keepPaused")}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <p className="text-sm text-text-muted flex items-center gap-1.5">
          <Undo2 size={14} /> {t("pausedAgo", { days })}
        </p>
        <ProjectClosureNotes project={project} />

        {hasParked && (
          <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
            <p className="text-sm flex items-center gap-1.5">
              <CalendarClock size={14} className="text-accent-2" />
              <span>
                {t("parkedTasks", { count: parkedTaskCount })}
                {nextDateLabel
                  ? ` ${t("parkedNext", { date: nextDateLabel })}`
                  : ""}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRestoreDates(false)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm border ${
                  restoreDates
                    ? "border-border text-text-muted"
                    : "border-accent text-text bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                }`}
              >
                {t("keepUnscheduledOption")}
              </button>
              <button
                type="button"
                onClick={() => setRestoreDates(true)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm border ${
                  restoreDates
                    ? "border-accent text-text bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                    : "border-border text-text-muted"
                }`}
              >
                {t("restoreOption")}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
