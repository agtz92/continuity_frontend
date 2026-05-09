"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import type { Idea } from "@/lib/types";

export function IdeaModal({
  idea,
  onSave,
  onClose,
}: {
  idea?: Idea | null;
  onSave: (i: {
    id?: string;
    title: string;
    description: string;
    why: string;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.idea");
  const tCommon = useTranslations("common");
  const [title, setTitle] = useState(idea?.title ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [why, setWhy] = useState(idea?.why ?? "");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      id: idea?.id,
      title: title.trim(),
      description,
      why,
    });
  };

  const isEdit = !!idea?.id;

  return (
    <Modal title={isEdit ? t("editTitle") : t("newTitle")} onClose={onClose}>
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        {!isEdit && (
          <p className="text-sm text-zinc-400 shrink-0">{t("intro")}</p>
        )}
        <Field label={t("title")}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
        </Field>
        <Field label={t("why")}>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={2}
            placeholder={t("whyPlaceholder")}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-y"
          />
        </Field>
        <Field label={t("notes")} grow>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-y flex-1 min-h-[80px]"
          />
        </Field>
        <div className="flex gap-2 pt-2 shrink-0">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm"
          >
            {isEdit ? tCommon("save") : t("captureCta")}
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
