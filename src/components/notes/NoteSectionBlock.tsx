"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { NoteSection } from "@/lib/types";
import { MarkdownText } from "./MarkdownText";

/**
 * One collapsible section (Notion-style toggle) inside a Quick Note.
 *
 * Holds its own draft for heading/body and persists on blur — the parent only
 * sees committed values. Mounted with `key={section.id}` by the editor so a
 * different section never reuses this component's local draft. Sortable via the
 * grip handle (the ▲▼ buttons are a keyboard/fallback path for the same order).
 */
export function NoteSectionBlock({
  section,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  section: NoteSection;
  onSave: (data: { heading: string; body: string; collapsed: boolean }) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const t = useTranslations("views.quickNotes");
  const [open, setOpen] = useState(!section.collapsed);
  const [editing, setEditing] = useState(!section.body.trim());
  const [heading, setHeading] = useState(section.heading);
  const [body, setBody] = useState(section.body);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const persist = (next: Partial<{ heading: string; body: string; collapsed: boolean }>) => {
    onSave({ heading, body, collapsed: !open, ...next });
  };

  const toggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    persist({ collapsed: !nextOpen });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-border rounded-xl bg-surface overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={toggle}
          aria-label={open ? t("collapse") : t("expand")}
          className="text-text-muted hover:text-accent shrink-0"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          onBlur={() => persist({})}
          placeholder={t("sectionHeading")}
          className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-text-muted placeholder:font-normal min-w-0"
        />
        <div className="flex items-center gap-0.5 shrink-0 text-text-muted">
          {open && (
            <button
              onClick={() => setEditing((e) => !e)}
              aria-label={editing ? t("preview") : t("edit")}
              className="p-1 hover:text-accent"
            >
              {editing ? <Eye size={14} /> : <Pencil size={14} />}
            </button>
          )}
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={t("moveUp")}
            className="p-1 hover:text-text disabled:opacity-30 disabled:hover:text-text-muted"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={t("moveDown")}
            className="p-1 hover:text-text disabled:opacity-30 disabled:hover:text-text-muted"
          >
            <ChevronDown size={14} />
          </button>
          <button
            {...attributes}
            {...listeners}
            aria-label={t("drag")}
            className="p-1 cursor-grab active:cursor-grabbing touch-none hover:text-text"
          >
            <GripVertical size={14} />
          </button>
          <button
            onClick={onDelete}
            aria-label={t("deleteSection")}
            className="p-1 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 pl-9">
          {editing ? (
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => persist({})}
              placeholder={t("sectionBody")}
              rows={Math.max(2, body.split("\n").length)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent resize-y placeholder:text-text-muted font-mono"
            />
          ) : body.trim() ? (
            <div
              onClick={() => setEditing(true)}
              className="cursor-text rounded-lg px-1 py-1"
            >
              <MarkdownText text={body} />
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-text-muted italic"
            >
              {t("sectionBody")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
