"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ProjectNote } from "@/lib/types";
import { useProjectNoteMutations } from "@/hooks/useProjectNoteMutations";
import { useAutoFocus } from "@/hooks/useAutoFocus";

/**
 * List of notes attached to a project + inline editor for new/existing notes.
 * Renders the LIST of cards; the wrapping `<ProjectSection>` (with the
 * collapse chevron and counter) lives in `ProjectsView`.
 */
export function NotesSection({
  projectId,
  notes,
}: {
  projectId: string;
  notes: ProjectNote[];
}) {
  const t = useTranslations("notes");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { create, update, remove, saving } = useProjectNoteMutations();

  const [editingId, setEditingId] = useState<string | null>(null); // null = no editor open; "new" = creating; <uuid> = editing existing
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const startNew = () => {
    setEditingId("new");
    setDraftTitle("");
    setDraftBody("");
  };

  const startEdit = (n: ProjectNote) => {
    setEditingId(n.id);
    setDraftTitle(n.title);
    setDraftBody(n.body);
  };

  const cancel = () => {
    setEditingId(null);
    setDraftTitle("");
    setDraftBody("");
  };

  const save = async () => {
    if (!draftBody.trim()) return;
    const ok =
      editingId === "new"
        ? await create({
            projectId,
            title: draftTitle.trim(),
            body: draftBody,
          })
        : editingId
          ? await update({
              id: editingId,
              projectId,
              title: draftTitle.trim(),
              body: draftBody,
            })
          : false;
    if (ok) cancel();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    await remove(id);
  };

  return (
    <div className="space-y-2">
      {/* Header: + New note (only when not currently editing a new one) */}
      {editingId !== "new" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startNew();
          }}
          className="text-xs text-accent hover:text-accent flex items-center gap-1"
        >
          <Plus size={12} /> {t("newNote")}
        </button>
      )}

      {/* New-note editor */}
      {editingId === "new" && (
        <NoteEditor
          title={draftTitle}
          body={draftBody}
          saving={saving}
          onTitleChange={setDraftTitle}
          onBodyChange={setDraftBody}
          onSave={save}
          onCancel={cancel}
          tCommon={tCommon}
          t={t}
        />
      )}

      {/* List */}
      {notes.length === 0 && editingId !== "new" ? (
        <div className="text-sm text-text-muted italic">{t("empty")}</div>
      ) : (
        notes.map((n) =>
          editingId === n.id ? (
            <NoteEditor
              key={n.id}
              title={draftTitle}
              body={draftBody}
              saving={saving}
              onTitleChange={setDraftTitle}
              onBodyChange={setDraftBody}
              onSave={save}
              onCancel={cancel}
              tCommon={tCommon}
              t={t}
            />
          ) : (
            <NoteCard
              key={n.id}
              note={n}
              locale={locale}
              onEdit={() => startEdit(n)}
              onDelete={() => handleDelete(n.id)}
              tCommon={tCommon}
              t={t}
            />
          )
        )
      )}
    </div>
  );
}

function NoteCard({
  note,
  locale,
  onEdit,
  onDelete,
  tCommon,
  t,
}: {
  note: ProjectNote;
  locale: string;
  onEdit: () => void;
  onDelete: () => void;
  tCommon: ReturnType<typeof useTranslations>;
  t: ReturnType<typeof useTranslations>;
}) {
  const heading = note.title || firstLine(note.body);
  const preview = note.title ? note.body : restAfterFirstLine(note.body);
  return (
    <div className="bg-bg/50 border border-border rounded-lg p-3 group">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium text-text truncate flex-1">
          {heading || (
            <span className="text-text-muted italic font-normal">
              {t("untitled")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-text-muted hover:text-accent p-1"
            aria-label={tCommon("edit")}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-text-muted hover:text-red-400 p-1"
            aria-label={tCommon("delete")}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {preview && (
        <div className="text-sm text-text-muted whitespace-pre-wrap line-clamp-3 mb-1.5">
          {preview}
        </div>
      )}
      <div className="text-[10px] uppercase tracking-wider text-text-muted">
        {formatRelative(note.updatedAt, locale, t)}
      </div>
    </div>
  );
}

function NoteEditor({
  title,
  body,
  saving,
  onTitleChange,
  onBodyChange,
  onSave,
  onCancel,
  tCommon,
  t,
}: {
  title: string;
  body: string;
  saving: boolean;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  tCommon: ReturnType<typeof useTranslations>;
  t: ReturnType<typeof useTranslations>;
}) {
  const autoFocus = useAutoFocus();
  return (
    <div
      className="bg-bg/70 border border-border rounded-lg p-3 space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t("titlePlaceholder")}
        className="w-full bg-transparent border-0 px-0 py-0 text-sm font-medium text-text placeholder:text-text-muted focus:outline-none focus:ring-0"
        autoFocus={autoFocus}
        enterKeyHint="next"
      />
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onSave();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        placeholder={t("bodyPlaceholder")}
        className="w-full bg-surface border border-accent/40 rounded-md px-2.5 py-2 text-sm text-text placeholder:text-text-muted resize-y min-h-[100px] focus:outline-none"
        rows={4}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] text-text-muted">{t("editorHint")}</div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs bg-border hover:opacity-80 rounded-md flex items-center gap-1"
          >
            <X size={12} /> {tCommon("cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={saving || !body.trim()}
            className="px-3 py-1 text-xs bg-accent hover:opacity-90 text-bg rounded-md font-medium disabled:opacity-50 flex items-center gap-1"
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : null}
            {tCommon("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function firstLine(s: string): string {
  return s.split("\n", 1)[0]?.trim() ?? "";
}

function restAfterFirstLine(s: string): string {
  const parts = s.split("\n");
  return parts.slice(1).join("\n").trim();
}

function formatRelative(
  iso: string,
  locale: string,
  t: ReturnType<typeof useTranslations>
): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("daysAgo", { count: days });
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
