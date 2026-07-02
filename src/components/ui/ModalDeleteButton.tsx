"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Two-step inline delete for edit modals. The first click arms it (the button
 * turns into a solid red "confirm?"), the second deletes. Keeps the destructive
 * action off the list row — where it sat one mis-tap from the completion
 * toggle — and behind a deliberate confirm, without a modal-over-modal dialog.
 * Sits at the left of the modal footer (mr-auto) so it reads as separate from
 * the primary Save/Cancel pair.
 */
export function ModalDeleteButton({
  label,
  confirmLabel,
  onDelete,
}: {
  label: string;
  confirmLabel: string;
  onDelete: () => void | Promise<void>;
}) {
  const tCommon = useTranslations("common");
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="mr-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={15} />
        {label}
      </button>
    );
  }

  return (
    <div className="mr-auto inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => void onDelete()}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
      >
        <Trash2 size={15} />
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-border transition-colors"
      >
        {tCommon("cancel")}
      </button>
    </div>
  );
}
