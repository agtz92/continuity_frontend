"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import { daysSince } from "@/lib/date";
import type { Project } from "@/lib/types";

type StalledChoice = "active" | "pause" | "kill";

/**
 * Shown on dashboard load for each project that the backend cron has marked
 * `stalled`. One project at a time (the parent queues them). No drifting: the
 * user must make a call. "Keep Active" saves status=active; "Pause" / "Kill"
 * hand off to the closure modals via the parent.
 *
 * Copy is verbatim from the State Closure spec — do not paraphrase.
 */
export function StalledProjectModal({
  project,
  onKeepActive,
  onPause,
  onKill,
  onClose,
}: {
  project: Project;
  onKeepActive: () => void | Promise<void>;
  onPause: () => void;
  onKill: () => void;
  /** Closes the queue item without acting (e.g. user dismissed everything). */
  onClose: () => void;
}) {
  const t = useTranslations("views.closure.stalled");
  const [choice, setChoice] = useState<StalledChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const days = daysSince(project.stalledAt ?? project.lastActivity) ?? 0;

  const handleSubmit = async () => {
    if (!choice || submitting) return;
    if (choice === "active") {
      setSubmitting(true);
      await onKeepActive();
      setSubmitting(false);
    } else if (choice === "pause") {
      onPause();
    } else {
      onKill();
    }
  };

  const options: { value: StalledChoice; label: string }[] = [
    { value: "active", label: t("keepActive") },
    { value: "pause", label: t("pause") },
    { value: "kill", label: t("kill") },
  ];

  return (
    <Modal
      title={t("title", { name: project.name, days })}
      onClose={onClose}
      footer={
        <button
          onClick={handleSubmit}
          disabled={!choice || submitting}
          className="w-full px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm"
        >
          {t("submit")}
        </button>
      }
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <p className="text-sm text-text-muted">{t("question")}</p>

        <div role="radiogroup" className="flex flex-col gap-2">
          {options.map((opt) => {
            const active = choice === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setChoice(opt.value)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg border text-left text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-text"
                    : "border-border bg-border text-text-muted hover:opacity-80"
                }`}
              >
                <span
                  className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    active ? "border-accent" : "border-text-muted"
                  }`}
                >
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-text-muted border-t border-border pt-3">
          {t("footer")}
        </p>
      </div>
    </Modal>
  );
}
