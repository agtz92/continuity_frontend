"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, HeartPulse, Lightbulb, RefreshCw, Zap } from "lucide-react";
import { Modal } from "../ui/Modal";
import type { Project } from "@/lib/types";

/**
 * Revive a killed project back to Active or Idea. No closure notes needed; the
 * backend re-checks the plan cap (killed projects don't count) and may throw
 * QUOTA_EXCEEDED, which errorLink already toasts.
 *
 * Killing parked the project's task due dates (state-closure). Like the paused
 * WelcomeBackCard, reviving offers to restore the original dates or leave them
 * unscheduled (default: unscheduled — suggest, not auto).
 *
 * Copy is verbatim from the State Closure spec — do not paraphrase.
 */
export function ReviveProjectModal({
  project,
  activeUsed,
  activeCap,
  parkedTaskCount = 0,
  nextParkedDate = null,
  onRevive,
  onClose,
}: {
  project: Project;
  /** Counting projects currently used (for the cap line). Optional. */
  activeUsed?: number;
  /** Plan cap for counting projects. Optional. */
  activeCap?: number;
  /** How many of the project's tasks have a parked due-date snapshot. */
  parkedTaskCount?: number;
  /** Soonest parked due date (ISO), for the hint line. */
  nextParkedDate?: string | null;
  /** Resolves true on success; parent closes. */
  onRevive: (
    target: "active" | "idea",
    restoreDates: boolean
  ) => Promise<boolean>;
  onClose: () => void;
}) {
  const t = useTranslations("views.closure.revive");
  const tw = useTranslations("views.closure.welcomeBack");
  const [saving, setSaving] = useState<"active" | "idea" | null>(null);
  // Suggest, not auto: default to leaving tasks unscheduled.
  const [restoreDates, setRestoreDates] = useState(false);
  const hasParked = parkedTaskCount > 0;
  const nextDateLabel = nextParkedDate
    ? new Date(nextParkedDate).toLocaleDateString()
    : null;

  const handle = async (target: "active" | "idea") => {
    if (saving) return;
    setSaving(target);
    const ok = await onRevive(target, hasParked && restoreDates);
    setSaving(null);
    if (!ok) return; // errorLink already toasted (e.g. QUOTA_EXCEEDED)
  };

  const showCap = typeof activeUsed === "number" && typeof activeCap === "number";

  return (
    <Modal
      title={t("title", { name: project.name })}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handle("active")}
              disabled={saving !== null}
              className="flex-1 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm flex items-center justify-center gap-1.5"
            >
              <Zap size={14} /> {t("active")}
            </button>
            <button
              onClick={() => handle("idea")}
              disabled={saving !== null}
              className="flex-1 px-4 py-2 bg-border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm flex items-center justify-center gap-1.5"
            >
              <Lightbulb size={14} /> {t("idea")}
            </button>
          </div>
          <button
            onClick={onClose}
            disabled={saving !== null}
            className="text-sm text-text-muted hover:text-text py-1"
          >
            {t("leaveDead")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <p className="text-sm text-text-muted flex items-start gap-1.5">
          <HeartPulse size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{t("intro")}</span>
        </p>

        {project.killedWouldRestart ? (
          <div className="rounded-lg border border-border bg-border/50 p-3">
            <div className="text-xs uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
              <RefreshCw size={11} /> {t("wouldRestartLabel")}
            </div>
            <div className="text-sm text-text">{project.killedWouldRestart}</div>
          </div>
        ) : null}

        {showCap ? (
          <p className="text-xs text-text-muted">
            {t("capLine", { used: activeUsed!, cap: activeCap! })}
          </p>
        ) : null}

        {hasParked && (
          <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
            <p className="text-sm flex items-center gap-1.5">
              <CalendarClock size={14} className="text-accent-2" />
              <span>
                {tw("parkedTasks", { count: parkedTaskCount })}
                {nextDateLabel
                  ? ` ${tw("parkedNext", { date: nextDateLabel })}`
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
                {tw("keepUnscheduledOption")}
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
                {tw("restoreOption")}
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-text-muted">{t("bringBackAs")}</p>
      </div>
    </Modal>
  );
}
