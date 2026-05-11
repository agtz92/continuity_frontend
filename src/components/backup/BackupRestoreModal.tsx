"use client";

import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";

export function BackupRestoreModal({
  counts,
  lastBackup,
  onExport,
  onImport,
  onClose,
}: {
  counts: { projects: number; tasks: number; ideas: number; updates: number };
  lastBackup: string | null;
  onExport: () => void | Promise<void>;
  onImport: (file: File, mode: "merge" | "replace") => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.backup");
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerImport = (mode: "merge" | "replace") => {
    if (mode === "replace") {
      if (!confirm(t("replaceConfirm"))) return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.dataset.mode = mode;
      fileInputRef.current.click();
    }
  };

  return (
    <Modal title={t("title")} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-sm text-text-muted">{t("intro")}</div>

        <div className="bg-border/50 border border-border rounded-lg p-3 text-sm">
          <div className="text-text-muted font-medium mb-1">{t("currentData")}</div>
          <div className="text-text-muted text-xs">
            {t("counts", {
              projects: counts.projects,
              tasks: counts.tasks,
              ideas: counts.ideas,
              updates: counts.updates,
            })}
          </div>
          {lastBackup && (
            <div className="text-text-muted text-xs mt-1">
              {t("lastBackup", {
                when: new Date(lastBackup).toLocaleString(locale),
              })}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => onExport()}
            className="w-full px-4 py-2.5 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} /> {t("exportCta")}
          </button>
        </div>

        <div className="border-t border-border pt-4">
          <div className="text-text-muted font-medium text-sm mb-2">
            {t("restoreHeader")}
          </div>
          <div className="text-xs text-text-muted mb-3">{t("restoreIntro")}</div>
          <div className="space-y-2">
            <button
              onClick={() => triggerImport("merge")}
              className="w-full px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Upload size={14} /> {t("importMerge")}
            </button>
            <button
              onClick={() => triggerImport("replace")}
              className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Upload size={14} /> {t("importReplace")}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const mode = (e.target.dataset.mode as "merge" | "replace") || "merge";
              onImport(file, mode);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      </div>
    </Modal>
  );
}
