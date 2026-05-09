"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";

export function UpdateModal({
  projectName,
  initialNote = "",
  isEdit = false,
  onSave,
  onClose,
}: {
  projectName: string;
  initialNote?: string;
  isEdit?: boolean;
  onSave: (note: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.update");
  const tCommon = useTranslations("common");
  const [note, setNote] = useState(initialNote);

  const handleSubmit = () => {
    if (!note.trim()) return;
    onSave(note.trim());
  };

  return (
    <Modal
      title={`${isEdit ? t("editTitle") : t("newTitle")} — ${projectName}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <Field label={t("field")} grow>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-y flex-1 min-h-[80px]"
            autoFocus
          />
        </Field>
        <div className="flex gap-2 pt-2 shrink-0">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm"
          >
            {isEdit ? tCommon("save") : t("logCta")}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            {tCommon("cancel")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
