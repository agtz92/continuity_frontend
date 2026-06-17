"use client";

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { toast } from "@/lib/toast";

/**
 * Closure ritual for killing a project. Killing requires reason + learnings
 * (would-restart optional); enforced client-side so the backend's
 * CLOSURE_NOTES_REQUIRED check is just a backstop. Cancelling reverts to the
 * previous status (the parent never saves on close).
 *
 * Copy is verbatim from the State Closure spec — do not paraphrase.
 */
export function KillProjectModal({
  projectName,
  onConfirm,
  onClose,
}: {
  projectName: string;
  /** Resolves true on a successful save; parent closes the modal. */
  onConfirm: (notes: {
    killedReason: string;
    killedLearnings: string;
    killedWouldRestart: string;
  }) => Promise<boolean>;
  onClose: () => void;
}) {
  const autoFocus = useAutoFocus();
  const [reason, setReason] = useState("");
  const [learnings, setLearnings] = useState("");
  const [wouldRestart, setWouldRestart] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit =
    reason.trim().length > 0 && learnings.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const ok = await onConfirm({
      killedReason: reason.trim(),
      killedLearnings: learnings.trim(),
      killedWouldRestart: wouldRestart.trim(),
    });
    setSaving(false);
    if (ok) toast.success("Killed with intention. Lesson saved.");
  };

  return (
    <Modal
      title={`Killing "${projectName}"`}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm"
          >
            Kill with intention
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <p className="text-sm text-text-muted">
          Killing is a form of finishing. It deserves a closing ritual.
        </p>

        <Field label="Why are you killing this?">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={
              'e.g., "The scope kept growing and I never validated the core assumption."'
            }
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
            autoFocus={autoFocus}
          />
        </Field>

        <Field label="What did you learn from it?">
          <textarea
            value={learnings}
            onChange={(e) => setLearnings(e.target.value)}
            rows={2}
            placeholder={
              'e.g., "I should have shipped a 1-week MVP before building 5 months of infrastructure."'
            }
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>

        <Field label="Would you start it again with what you know now? (optional)">
          <textarea
            value={wouldRestart}
            onChange={(e) => setWouldRestart(e.target.value)}
            rows={2}
            placeholder={
              'e.g., "Yes, but with a much smaller scope and 2 user interviews first."'
            }
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>

        <p className="text-xs text-text-muted border-t border-border pt-3">
          We save this in your Project Graveyard. Not a tombstone, a library of
          what didn&apos;t work so you don&apos;t repeat it.
        </p>
      </div>
    </Modal>
  );
}
