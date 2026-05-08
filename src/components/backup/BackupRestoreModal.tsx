"use client";

import { useRef } from "react";
import { Download, Upload } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerImport = (mode: "merge" | "replace") => {
    if (mode === "replace") {
      if (
        !confirm(
          "This will DELETE all current data and replace it with the backup. Continue?"
        )
      )
        return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.dataset.mode = mode;
      fileInputRef.current.click();
    }
  };

  return (
    <Modal title="Backup & Restore" onClose={onClose}>
      <div className="space-y-4">
        <div className="text-sm text-zinc-400">
          Export a JSON file with all your projects, tasks, ideas, and activity log.
          Save it somewhere safe (Google Drive, Dropbox, iCloud).
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm">
          <div className="text-zinc-300 font-medium mb-1">Current data</div>
          <div className="text-zinc-500 text-xs">
            {counts.projects} projects · {counts.tasks} tasks · {counts.ideas} ideas ·{" "}
            {counts.updates} updates
          </div>
          {lastBackup && (
            <div className="text-zinc-500 text-xs mt-1">
              Last backup: {new Date(lastBackup).toLocaleString()}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => onExport()}
            className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} /> Export to JSON file
          </button>
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <div className="text-zinc-300 font-medium text-sm mb-2">Restore from backup</div>
          <div className="text-xs text-zinc-500 mb-3">
            Select a previously exported JSON file. Choose how to handle existing data:
          </div>
          <div className="space-y-2">
            <button
              onClick={() => triggerImport("merge")}
              className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Upload size={14} /> Import & merge with current data
            </button>
            <button
              onClick={() => triggerImport("replace")}
              className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Upload size={14} /> Import & replace all data
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
