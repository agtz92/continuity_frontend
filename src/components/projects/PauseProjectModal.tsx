"use client";

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { toast } from "@/lib/toast";

/**
 * Closure ritual for pausing a project. Pausing requires context + next action
 * (blocker optional); enforced client-side here so the backend's
 * CLOSURE_NOTES_REQUIRED check is just a backstop. Cancelling reverts to the
 * previous status (the parent never saves on close).
 *
 * Copy is verbatim from the State Closure spec — do not paraphrase.
 */
export function PauseProjectModal({
  projectName,
  onConfirm,
  onClose,
}: {
  projectName: string;
  /** Resolves true on a successful save; parent closes the modal. */
  onConfirm: (notes: {
    pausedContext: string;
    pausedNextAction: string;
    pausedBlocker: string;
  }) => Promise<boolean>;
  onClose: () => void;
}) {
  const autoFocus = useAutoFocus();
  const [context, setContext] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [blocker, setBlocker] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit =
    context.trim().length > 0 && nextAction.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const ok = await onConfirm({
      pausedContext: context.trim(),
      pausedNextAction: nextAction.trim(),
      pausedBlocker: blocker.trim(),
    });
    setSaving(false);
    if (ok) toast.success("Paused. Future you will thank you.");
  };

  return (
    <Modal
      title={`Pausing "${projectName}"`}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm"
          >
            Pause project
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
          Before you pause this, write something for the version of you who will
          come back to it. Three quick prompts. Two minutes total.
        </p>

        <Field label="Where exactly are you stopping?">
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            placeholder={'e.g., "Finished hero section. Stuck on pricing logic."'}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
            autoFocus={autoFocus}
          />
        </Field>

        <Field label="What's the very next action when you return?">
          <textarea
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            rows={2}
            placeholder={'e.g., "Write the pricing comparison table copy."'}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>

        <Field label="What's blocking you right now? (optional)">
          <textarea
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            rows={2}
            placeholder={
              'e.g., "Need to talk to 2 users before deciding on pricing strategy."'
            }
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>

        <p className="text-xs text-text-muted border-t border-border pt-3">
          Why we ask: Future you will not remember this. Past you owes future you
          a note.
        </p>
      </div>
    </Modal>
  );
}
