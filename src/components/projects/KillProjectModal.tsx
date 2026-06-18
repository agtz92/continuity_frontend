"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("views.closure.kill");
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
    if (ok) toast.success(t("toast"));
  };

  return (
    <Modal
      title={t("title", { name: projectName })}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm"
          >
            {t("submit")}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm"
          >
            {t("cancel")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <p className="text-sm text-text-muted">{t("intro")}</p>

        <Field label={t("reasonLabel")}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
            autoFocus={autoFocus}
          />
        </Field>

        <Field label={t("learningsLabel")}>
          <textarea
            value={learnings}
            onChange={(e) => setLearnings(e.target.value)}
            rows={2}
            placeholder={t("learningsPlaceholder")}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>

        <Field label={t("wouldRestartLabel")}>
          <textarea
            value={wouldRestart}
            onChange={(e) => setWouldRestart(e.target.value)}
            rows={2}
            placeholder={t("wouldRestartPlaceholder")}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>

        <p className="text-xs text-text-muted border-t border-border pt-3">
          {t("footer")}
        </p>
      </div>
    </Modal>
  );
}
