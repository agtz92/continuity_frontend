"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import type { Category } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";

export function CategoryManagementModal({
  categories,
  onDelete,
  onClose,
}: {
  categories: Category[];
  onDelete: (id: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.category");
  const tCommon = useTranslations("common");
  return (
    <Modal title={t("title")} onClose={onClose}>
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-sm text-text-muted italic text-center py-6">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-1.5">
            {categories.map((c) => {
              const cls = categoryColorClass(c.color);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-border/50 border border-border rounded-md px-3 py-2"
                >
                  <span className={`w-3 h-3 rounded-full ${cls.dot}`} />
                  <span className="flex-1 text-sm">{c.name}</span>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-text-muted hover:text-red-400 p-1"
                    title={t("deleteAria")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-text-muted">{t("footnote")}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm"
        >
          {tCommon("close")}
        </button>
      </div>
    </Modal>
  );
}
