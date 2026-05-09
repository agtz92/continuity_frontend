"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ProjectNote } from "@/lib/types";
import { useProjectNoteMutations } from "@/hooks/useProjectNoteMutations";

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
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
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
        <div className="text-sm text-zinc-500 italic">{t("empty")}</div>
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
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 group">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium text-zinc-100 truncate flex-1">
          {heading || (
            <span className="text-zinc-500 italic font-normal">
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
            className="text-zinc-500 hover:text-emerald-400 p-1"
            aria-label={tCommon("edit")}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-zinc-500 hover:text-red-400 p-1"
            aria-label={tCommon("delete")}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {preview && (
        <div className="text-sm text-zinc-400 whitespace-pre-wrap line-clamp-3 mb-1.5">
          {preview}
        </div>
      )}
      <div className="text-[10px] uppercase tracking-wider text-zinc-600">
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
  return (
    <div
      className="bg-zinc-950/70 border border-emerald-500/30 rounded-lg p-3 space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t("titlePlaceholder")}
        className="w-full bg-transparent border-0 px-0 py-0 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
        autoFocus
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
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-2.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 resize-y min-h-[100px] focus:outline-none focus:border-emerald-500/40"
        rows={4}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] text-zinc-600">{t("editorHint")}</div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center gap-1"
          >
            <X size={12} /> {tCommon("cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={saving || !body.trim()}
            className="px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-md font-medium disabled:opacity-50 flex items-center gap-1"
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
