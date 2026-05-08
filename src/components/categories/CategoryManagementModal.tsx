"use client";

import { Trash2 } from "lucide-react";
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
  return (
    <Modal title="Manage categories" onClose={onClose}>
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-sm text-zinc-500 italic text-center py-6">
            No categories yet. Create one from a project.
          </div>
        ) : (
          <div className="space-y-1.5">
            {categories.map((c) => {
              const cls = categoryColorClass(c.color);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2"
                >
                  <span className={`w-3 h-3 rounded-full ${cls.dot}`} />
                  <span className="flex-1 text-sm">{c.name}</span>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-zinc-500 hover:text-red-400 p-1"
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-zinc-500">
          Deleting a category leaves its projects intact (just uncategorized).
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
