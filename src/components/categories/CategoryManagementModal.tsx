"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import type { Category } from "@/lib/types";
import { CATEGORY_COLORS, categoryColorClass } from "@/lib/types";

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {CATEGORY_COLORS.map((color) => {
        const cls = categoryColorClass(color);
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={color}
            className={`w-5 h-5 rounded-full ${cls.dot} transition-transform ${
              value === color ? "ring-2 ring-offset-1 ring-white scale-110" : "opacity-70 hover:opacity-100"
            }`}
          />
        );
      })}
    </div>
  );
}

function CategoryForm({
  initialName = "",
  initialColor = "emerald",
  onSave,
  onCancel,
  saveLabel,
}: {
  initialName?: string;
  initialColor?: string;
  onSave: (name: string, color: string) => Promise<void>;
  onCancel: () => void;
  saveLabel: string;
}) {
  const t = useTranslations("modals.category");
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), color);
    setSaving(false);
  };

  return (
    <div className="space-y-2.5 p-3 bg-border/50 border border-border rounded-md">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("namePlaceholder")}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onCancel();
        }}
        className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex-1 text-sm py-1.5 bg-accent text-white rounded-md disabled:opacity-40 hover:opacity-90"
        >
          {saveLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-3 text-sm py-1.5 bg-border rounded-md hover:opacity-80"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

export function CategoryManagementModal({
  categories,
  onDelete,
  onCreate,
  onUpdate,
  onClose,
}: {
  categories: Category[];
  onDelete: (id: string) => void | Promise<void>;
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, name: string, color: string) => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.category");
  const tCommon = useTranslations("common");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const startEdit = (id: string) => {
    setAdding(false);
    setEditingId(id);
  };

  const startAdd = () => {
    setEditingId(null);
    setAdding(true);
  };

  return (
    <Modal title={t("title")} onClose={onClose}>
      <div className="space-y-3">
        {categories.length === 0 && !adding ? (
          <div className="text-sm text-text-muted italic text-center py-4">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-1.5">
            {categories.map((c) => {
              const cls = categoryColorClass(c.color);
              if (editingId === c.id) {
                return (
                  <CategoryForm
                    key={c.id}
                    initialName={c.name}
                    initialColor={c.color}
                    saveLabel={t("save")}
                    onSave={async (name, color) => {
                      await onUpdate(c.id, name, color);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                );
              }
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-border/50 border border-border rounded-md px-3 py-2"
                >
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cls.dot}`} />
                  <span className="flex-1 text-sm">{c.name}</span>
                  <button
                    onClick={() => startEdit(c.id)}
                    className="text-text-muted hover:text-text p-1 transition-colors"
                    title={t("editAria")}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-text-muted hover:text-red-400 p-1 transition-colors"
                    title={t("deleteAria")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            {adding && (
              <CategoryForm
                saveLabel={t("create")}
                onSave={async (name, color) => {
                  await onCreate(name, color);
                  setAdding(false);
                }}
                onCancel={() => setAdding(false)}
              />
            )}
          </div>
        )}

        {!adding && editingId === null && (
          <button
            onClick={startAdd}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-dashed border-border hover:border-accent text-text-muted hover:text-accent rounded-lg text-sm transition-colors"
          >
            <Plus size={14} />
            {t("add")}
          </button>
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
