"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Meta } from "../ui/Meta";
import { EmptyState } from "../ui/EmptyState";
import { NoteIndex } from "../notes/NoteIndex";
import { NoteSearchResults } from "../notes/NoteSearchResults";
import { NoteSectionBlock } from "../notes/NoteSectionBlock";
import { searchSections, notesInHits } from "@/lib/noteSearch";

type Filter = string; // "all" | "loose" | "pinned" | <categoryId>

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
  // Sección a la que saltar tras abrir una nota desde un resultado de búsqueda.
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);

  /** Las notas que pasan los chips de filtro. La búsqueda ya no filtra aquí:
   *  cuando hay consulta, el panel enseña resultados por sección. */
  const inFilter = useMemo(
    () =>
      quickNotes.filter((n) => {
        if (filter === "loose" && n.categoryId) return false;
        if (filter === "pinned" && !n.pinned) return false;
        if (
          filter !== "all" &&
          filter !== "loose" &&
          filter !== "pinned" &&
          n.categoryId !== filter
        )
          return false;
        return true;
      }),
    [quickNotes, filter]
  );

  const query = search.trim();
  const searching = query.length > 0;
  const hits = useMemo(
    () => (searching ? searchSections(inFilter, query) : []),
    [searching, inFilter, query]
  );

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

  /** Abrir una nota desde un resultado y aterrizar en la sección que casó. */
  const jumpTo = (noteId: string, sectionId: string | null) => {
    setSelectedId(noteId);
    setFocusSectionId(sectionId);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <NotebookPen size={20} className="text-accent" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>
      <p className="text-sm text-text-muted mb-4 max-w-2xl">{t("subtitle")}</p>

      {/* Índice a la izquierda y editor al lado, SIEMPRE (DP-17): la rejilla de
          tarjetas desapareció. En móvil sigue siendo una cosa u otra, que es lo
          correcto — no caben dos columnas a 390px. */}
      <div className="grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] gap-4 items-start">
        {/* ---------- Índice ---------- */}
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
          ) : searching ? (
            <>
              <Meta variant="cintillo" tone="faint" className="block mb-1.5">
                {t("hitCount", { hits: hits.length, notes: notesInHits(hits) })}
              </Meta>
              <NoteSearchResults hits={hits} query={query} onJump={jumpTo} />
            </>
          ) : inFilter.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <p className="text-text-muted text-sm mb-4">{t("empty")}</p>
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-accent text-bg rounded-lg font-medium text-sm"
              >
                {t("addFirst")}
              </button>
            </div>
          ) : (
            <NoteIndex
              notes={inFilter}
              categories={categories}
              projects={projects}
              selectedId={selectedId}
              onSelect={(id) => jumpTo(id, null)}
            />
          )}
        </div>

        {/* ---------- Editor ---------- */}
        {selected ? (
          <div className="block">
            <NoteEditor
              key={selected.id}
              note={selected}
              categories={categories}
              projects={projects}
              m={m}
              focusSectionId={focusSectionId}
              onFocused={() => setFocusSectionId(null)}
              onBack={() => setSelectedId(null)}
              onDelete={() => handleDelete(selected.id)}
            />
          </div>
        ) : (
          // El panel del editor no se queda en blanco: con el índice fijo, ese
          // hueco es la mitad de la pantalla.
          <div className="hidden md:block">
            <EmptyState
              title={t("pickOne")}
              body={t("pickOneHint")}
              actions={
                <button
                  onClick={handleNew}
                  className="px-4 py-2 bg-accent text-bg rounded-md font-medium text-sm hover:bg-accent-hi transition-colors duration-150 ease-out"
                >
                  {t("newNote")}
                </button>
              }
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

function NoteEditor({
  note,
  categories,
  projects,
  m,
  focusSectionId,
  onFocused,
  onBack,
  onDelete,
}: {
  note: QuickNote;
  categories: Category[];
  projects: Project[];
  m: ReturnType<typeof useQuickNoteMutations>;
  /** Sección a la que saltar al abrir desde un resultado de búsqueda. */
  focusSectionId?: string | null;
  onFocused?: () => void;
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

  /**
   * Saltar a la sección que casó con la búsqueda. Se hace tras pintar y se
   * consume una sola vez: si no, cualquier reordenado o guardado volvería a
   * arrastrar la vista al mismo sitio.
   */
  useEffect(() => {
    if (!focusSectionId) return;
    const el = document.getElementById(`note-section-${focusSectionId}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    onFocused?.();
  }, [focusSectionId, onFocused]);

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
    <div className="bg-surface border border-border rounded-lg p-4 sm:p-5">
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
          className="p-1.5 rounded-lg text-text-muted hover:text-signal shrink-0"
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
                highlight={s.id === focusSectionId}
                onSave={(data) => m.updateSection(s.id, data)}
                onDelete={() => m.deleteSection(s.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={() => m.addSection(note.id)}
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-border hover:border-accent text-text-muted hover:text-accent rounded-lg text-sm transition-colors"
      >
        <Plus size={15} /> {t("addSection")}
      </button>
    </div>
  );
}
