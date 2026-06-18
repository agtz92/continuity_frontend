"use client";

import { useState } from "react";
import { HeartPulse, Lightbulb, RefreshCw, Zap } from "lucide-react";
import { Modal } from "../ui/Modal";
import type { Project } from "@/lib/types";

/**
 * Revive a killed project back to Active or Idea. No closure notes needed; the
 * backend re-checks the plan cap (killed projects don't count) and may throw
 * QUOTA_EXCEEDED, which errorLink already toasts.
 *
 * Copy is verbatim from the State Closure spec — do not paraphrase.
 */
export function ReviveProjectModal({
  project,
  activeUsed,
  activeCap,
  onRevive,
  onClose,
}: {
  project: Project;
  /** Counting projects currently used (for the cap line). Optional. */
  activeUsed?: number;
  /** Plan cap for counting projects. Optional. */
  activeCap?: number;
  /** Resolves true on success; parent closes. */
  onRevive: (target: "active" | "idea") => Promise<boolean>;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState<"active" | "idea" | null>(null);

  const handle = async (target: "active" | "idea") => {
    if (saving) return;
    setSaving(target);
    const ok = await onRevive(target);
    setSaving(null);
    if (!ok) return; // errorLink already toasted (e.g. QUOTA_EXCEEDED)
  };

  const showCap = typeof activeUsed === "number" && typeof activeCap === "number";

  return (
    <Modal
      title={`Revive "${project.name}"?`}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handle("active")}
              disabled={saving !== null}
              className="flex-1 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm flex items-center justify-center gap-1.5"
            >
              <Zap size={14} /> Active
            </button>
            <button
              onClick={() => handle("idea")}
              disabled={saving !== null}
              className="flex-1 px-4 py-2 bg-border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm flex items-center justify-center gap-1.5"
            >
              <Lightbulb size={14} /> Idea (re-validate)
            </button>
          </div>
          <button
            onClick={onClose}
            disabled={saving !== null}
            className="text-sm text-text-muted hover:text-text py-1"
          >
            Leave it dead
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <p className="text-sm text-text-muted flex items-start gap-1.5">
          <HeartPulse size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>
            You killed this once, on purpose. Bringing it back is fine. Just go in
            with what you learned.
          </span>
        </p>

        {project.killedWouldRestart ? (
          <div className="rounded-lg border border-border bg-border/50 p-3">
            <div className="text-xs uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
              <RefreshCw size={11} /> You said you&apos;d restart it like this
            </div>
            <div className="text-sm text-text">{project.killedWouldRestart}</div>
          </div>
        ) : null}

        {showCap ? (
          <p className="text-xs text-text-muted">
            Counts against your plan again — {activeUsed} / {activeCap} active
          </p>
        ) : null}

        <p className="text-sm text-text-muted">Bring it back as:</p>
      </div>
    </Modal>
  );
}
