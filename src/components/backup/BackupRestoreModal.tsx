"use client";

import { useRef, useState } from "react";
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
  counts: { projects: number; tasks: number; ideas: number; activities: number };
  lastBackup: string | null;
  onExport: () => void | Promise<void>;
  onImport: (file: File, mode: "merge" | "replace") => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.backup");
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Exportar y restaurar tardan unos segundos: sin esto se puede disparar dos veces.
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => void | Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

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

        <div className="bg-line-08 border border-border rounded-lg p-3 text-sm">
          <div className="text-text-muted font-medium mb-1">{t("currentData")}</div>
          <div className="text-text-muted text-xs">
            {t("counts", {
              projects: counts.projects,
              tasks: counts.tasks,
              ideas: counts.ideas,
              updates: counts.activities,
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
            onClick={() => run(onExport)}
            disabled={busy}
            className="w-full disabled:opacity-50 px-4 py-2.5 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} /> {busy ? t("working") : t("exportCta")}
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
              disabled={busy}
              className="w-full disabled:opacity-50 px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Upload size={14} /> {t("importMerge")}
            </button>
            <button
              onClick={() => triggerImport("replace")}
              disabled={busy}
              className="w-full disabled:opacity-50 px-4 py-2 bg-signal-a12 hover:bg-signal-a16 text-signal rounded-lg text-sm flex items-center justify-center gap-2"
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
              e.target.value = "";
              run(() => onImport(file, mode));
            }}
            className="hidden"
          />
        </div>
      </div>
    </Modal>
  );
}
