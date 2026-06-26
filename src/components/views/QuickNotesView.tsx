"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  NotebookPen,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Category, Project, QuickNote } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import { useQuickNotes } from "@/hooks/useQuickNotes";
import { useQuickNoteMutations } from "@/hooks/useQuickNoteMutations";
import { FAB } from "../ui/FAB";
import { NoteSectionBlock } from "../notes/NoteSectionBlock";

type Filter = string; // "all" | "loose" | "pinned" | <categoryId>

function noteMatches(note: QuickNote, q: string): boolean {
  if (!q) return true;
  const hay = [
    note.title,
    ...note.sections.flatMap((s) => [s.heading, s.body]),
  ]
    .join("\n")
    .toLowerCase();
  return hay.includes(q);
}

export function QuickNotesView({
  categories,
  projects,
}: {
  categories: Category[];
  projects: Project[];
}) {
  const t = useTranslations("views.quickNotes");
  const { quickNotes, loading } = useQuickNotes();
  const m = useQuickNoteMutations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quickNotes.filter((n) => {
      if (filter === "loose" && n.categoryId) return false;
      if (filter === "pinned" && !n.pinned) return false;
      if (
        filter !== "all" &&
        filter !== "loose" &&
        filter !== "pinned" &&
        n.categoryId !== filter
      )
        return false;
      return noteMatches(n, q);
    });
  }, [quickNotes, search, filter]);

  const selected = quickNotes.find((n) => n.id === selectedId) ?? null;

  const handleNew = async () => {
    const note = await m.createNote({
      categoryId: filter !== "all" && filter !== "loose" && filter !== "pinned" ? filter : null,
    });
    if (note) setSelectedId(note.id);
  };

  const handleDelete = async (id: string) => {
    await m.deleteNote(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <NotebookPen size={20} className="text-accent" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>
      <p className="text-sm text-text-muted mb-4 max-w-2xl">{t("subtitle")}</p>

      <div className={selected ? "grid md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] gap-4" : ""}>
        {/* ---------- List pane ---------- */}
        <div className={`${selected ? "hidden md:block" : "block"}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-text-muted outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleNew}
              className="px-3 py-2 bg-accent text-bg rounded-lg font-medium text-sm hidden md:flex items-center gap-1.5 shrink-0 hover:opacity-90"
            >
              <Plus size={16} /> {t("newNote")}
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            <FilterChip label={t("filters.all")} active={filter === "all"} onClick={() => setFilter("all")} />
            {categories.map((c) => {
              const cls = categoryColorClass(c.color);
              return (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                    filter === c.id ? cls.chip : "bg-surface border-border text-text-muted hover:text-text"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cls.dot}`} />
                  {c.name}
                </button>
              );
            })}
            <FilterChip label={t("filters.loose")} active={filter === "loose"} onClick={() => setFilter("loose")} />
            <FilterChip label={t("filters.pinned")} active={filter === "pinned"} onClick={() => setFilter("pinned")} />
          </div>

          {loading && quickNotes.length === 0 ? (
            <div className="text-sm text-text-muted py-8 text-center">{t("loading")}</div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-text-muted text-sm mb-4">
                {search.trim() ? t("noMatch", { query: search }) : t("empty")}
              </p>
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-accent text-bg rounded-lg font-medium text-sm"
              >
                {t("addFirst")}
              </button>
            </div>
          ) : (
            <div className={`grid gap-2 ${selected ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
              {filtered.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  categories={categories}
                  projects={projects}
                  selected={n.id === selectedId}
                  onSelect={() => setSelectedId(n.id)}
                  emptyTitle={t("untitled")}
                  sectionsLabel={t("sectionCount", { count: n.sections.length })}
                  standaloneLabel={t("standalone")}
                />
              ))}
            </div>
          )}
        </div>

        {/* ---------- Editor pane (only when a note is open) ---------- */}
        {selected && (
          <div className="block">
            <NoteEditor
              key={selected.id}
              note={selected}
              categories={categories}
              projects={projects}
              m={m}
              onBack={() => setSelectedId(null)}
              onDelete={() => handleDelete(selected.id)}
            />
          </div>
        )}
      </div>

      <FAB icon={<Plus size={24} />} label={t("newNote")} onClick={handleNew} />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border ${
        active
          ? "bg-accent border-accent text-bg"
          : "bg-surface border-border text-text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

function NoteCard({
  note,
  categories,
  projects,
  selected,
  onSelect,
  emptyTitle,
  sectionsLabel,
  standaloneLabel,
}: {
  note: QuickNote;
  categories: Category[];
  projects: Project[];
  selected: boolean;
  onSelect: () => void;
  emptyTitle: string;
  sectionsLabel: string;
  standaloneLabel: string;
}) {
  const cat = categories.find((c) => c.id === note.categoryId) ?? null;
  const proj = projects.find((p) => p.id === note.projectId) ?? null;
  const cls = cat ? categoryColorClass(cat.color) : null;
  const preview =
    note.sections.find((s) => s.body.trim())?.body.trim() ??
    note.sections.find((s) => s.heading.trim())?.heading.trim() ??
    "";

  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left bg-surface border rounded-xl p-3 pl-4 overflow-hidden transition-colors ${
        selected ? "border-accent" : "border-border hover:border-text-muted"
      }`}
    >
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${cls ? cls.dot : "bg-border"}`}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm truncate">
          {note.title.trim() || emptyTitle}
        </span>
        {note.pinned && <Pin size={13} className="text-accent shrink-0 fill-current" />}
      </div>
      {preview && (
        <p className="text-xs text-text-muted mt-1 line-clamp-2 break-words">{preview}</p>
      )}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {cat && cls && (
          <span className={`text-[10px] px-2 py-0.5 rounded border ${cls.chip}`}>{cat.name}</span>
        )}
        {proj && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-bg border border-border text-text-muted truncate max-w-[8rem]">
            {proj.name}
          </span>
        )}
        {!cat && !proj && (
          <span className="text-[10px] text-text-muted italic">{standaloneLabel}</span>
        )}
        <span className="text-[10px] text-text-muted ml-auto">{sectionsLabel}</span>
      </div>
    </button>
  );
}

function NoteEditor({
  note,
  categories,
  projects,
  m,
  onBack,
  onDelete,
}: {
  note: QuickNote;
  categories: Category[];
  projects: Project[];
  m: ReturnType<typeof useQuickNoteMutations>;
  onBack: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("views.quickNotes");
  const tCommon = useTranslations("common");
  const [title, setTitle] = useState(note.title);

  const saveMeta = (patch: {
    title?: string;
    categoryId?: string | null;
    projectId?: string | null;
    pinned?: boolean;
  }) => {
    m.updateNote(note.id, {
      title,
      categoryId: note.categoryId,
      projectId: note.projectId,
      pinned: note.pinned,
      ...patch,
    });
  };

  const sections = [...note.sections].sort((a, b) => a.position - b.position);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sections.map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    m.reorderSections(note.id, arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onBack}
          className="md:hidden text-text-muted hover:text-text p-1 -ml-1"
          aria-label={tCommon("back")}
        >
          <ArrowLeft size={18} />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => saveMeta({})}
          placeholder={t("titlePlaceholder")}
          className="flex-1 bg-transparent text-xl font-semibold outline-none placeholder:text-text-muted min-w-0"
        />
        <button
          onClick={() => m.setPinned(note.id, !note.pinned)}
          aria-label={t("pin")}
          className={`p-1.5 rounded-lg shrink-0 ${
            note.pinned ? "text-accent" : "text-text-muted hover:text-text"
          }`}
        >
          <Pin size={16} className={note.pinned ? "fill-current" : ""} />
        </button>
        <button
          onClick={onDelete}
          aria-label={tCommon("delete")}
          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 shrink-0"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onBack}
          aria-label={tCommon("close")}
          className="hidden md:inline-flex p-1.5 rounded-lg text-text-muted hover:text-text shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Meta row: category + project */}
      <div className="flex flex-wrap gap-3 mb-4">
        <label className="flex items-center gap-2 text-xs">
          <span className="uppercase tracking-wider text-text-muted">{t("category")}</span>
          <select
            value={note.categoryId ?? ""}
            onChange={(e) => saveMeta({ categoryId: e.target.value || null })}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="">{t("noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="uppercase tracking-wider text-text-muted">{t("project")}</span>
          <select
            value={note.projectId ?? ""}
            onChange={(e) => saveMeta({ projectId: e.target.value || null })}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="">{t("noProject")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((s) => (
              <NoteSectionBlock
                key={s.id}
                section={s}
                onSave={(data) => m.updateSection(s.id, data)}
                onDelete={() => m.deleteSection(s.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={() => m.addSection(note.id)}
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-border hover:border-accent text-text-muted hover:text-accent rounded-xl text-sm transition-colors"
      >
        <Plus size={15} /> {t("addSection")}
      </button>
    </div>
  );
}
