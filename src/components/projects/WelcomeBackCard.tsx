"use client";

import { useState } from "react";
import { Undo2, Zap } from "lucide-react";
import { Modal } from "../ui/Modal";
import { ProjectClosureNotes } from "./ProjectClosureNotes";
import { daysSince } from "@/lib/date";
import type { Project } from "@/lib/types";

/**
 * Shown when the user opens a paused project. Surfaces the closure notes they
 * wrote (context / next action / blocker) and offers Reactivate vs Keep paused.
 *
 * Copy is verbatim from the State Closure spec — do not paraphrase.
 */
export function WelcomeBackCard({
  project,
  onReactivate,
  onClose,
}: {
  project: Project;
  /** Saves status=active. Resolves true on success; parent closes. */
  onReactivate: () => Promise<boolean>;
  /** Keep paused: close, read-only. */
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const days = daysSince(project.pausedAt ?? project.lastActivity) ?? 0;

  const handleReactivate = async () => {
    if (saving) return;
    setSaving(true);
    const ok = await onReactivate();
    setSaving(false);
    if (!ok) return; // errorLink already toasted
  };

  return (
    <Modal
      title={`Welcome back to "${project.name}"`}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-muted text-center">
            Ready to pick this back up?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReactivate}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm flex items-center justify-center gap-1.5"
            >
              <Zap size={14} /> Reactivate project
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm"
            >
              Keep paused
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <p className="text-sm text-text-muted flex items-center gap-1.5">
          <Undo2 size={14} /> You paused this {days} days ago.
        </p>
        <ProjectClosureNotes project={project} />
      </div>
    </Modal>
  );
}
