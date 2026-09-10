"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { useLocale, useTranslations } from "next-intl";

import type { Project, QuickNote } from "@/lib/types";
import type { DashboardView } from "@/lib/dashboardViews";
import { QUICK_NOTES_QUERY } from "@/lib/graphql";
import { searchSections, type SectionHit } from "@/lib/noteSearch";
import {
  CAPTURE_KINDS,
  activeToken,
  composeCaptureLine,
  projectSuggestions,
  projectToken,
  quickParse,
  replaceToken,
  type CaptureKind,
} from "@/lib/quickParse";
import {
  clearDraft,
  newToken,
  readDraft,
  saveDraft,
} from "@/lib/captureQueue";
import { useQuickCapture, type SavedCapture } from "@/hooks/useQuickCapture";
import { CapturePlanError, parseCapture } from "@/lib/assistantApi";
import { toast } from "@/lib/toast";
import { Meta } from "./Meta";

/** Los destinos del modo "ir a", en el orden de la barra lateral. */
const VIEWS: DashboardView[] = [
  "today",
  "projects",
  "tasks",
  "routines",
  "calendar",
  "ideas",
  "notes",
  "log",
  "analytics",
  "graveyard",
];

const MAX_RESULTS_PER_GROUP = 5;

type GotoResult =
  | { kind: "view"; id: string; view: DashboardView }
  | { kind: "project"; id: string; project: Project }
  | { kind: "note"; id: string; hit: SectionHit };

/**
 * Captura rápida (⌘K).
 *
 * Una línea, sin ratón: `#` proyecto, `@` fecha y hora, `~` duración, `!`
 * bloqueo, `/tipo` el tipo. `↵` guarda, `⇧↵` guarda y abre, `ESC` cierra.
 * `⌘1..⌘4` cambian de tipo. El parser vive aparte (`lib/quickParse.ts`) y está
 * cubierto por tests — es lo que decide qué acaba siendo el título, y
 * equivocarse ahí es perder texto en silencio.
 *
 * Cuatro cosas que este overlay se toma en serio:
 *
 * 1. **Lo que se ve bajo el campo es lo que se va a guardar**, resuelto en
 *    vivo: el nombre real del proyecto, el día con su nombre, la duración, la
 *    razón del bloqueo. Y lo que **no** resolvió también se dice, en vez de
 *    dejar que el usuario descubra luego que su `@juan` no era una fecha.
 * 2. **`#` ya no adivina.** Sugiere mientras escribes (↑↓ y ↵ para aceptar) y,
 *    si el texto casa con dos proyectos, pregunta en vez de elegir el de nombre
 *    más corto, que es como se cuelgan tareas del proyecto equivocado.
 * 3. **Nada se pierde.** Lo escrito sobrevive a ESC y a recargar; si la red
 *    falla, la captura se encola y se reintenta sola; y tras guardar hay
 *    "Deshacer" durante unos segundos, porque guardar y cerrar en una sola
 *    tecla no deja otro momento para rectificar.
 * 4. **TAB vuelve a ser TAB.** Antes rotaba el tipo, así que no se podía
 *    tabular al botón de guardar ni salir del campo — un teclado atrapado en un
 *    diálogo. El tipo ahora se cambia con `⌘1..⌘4` o escribiendo `/idea`.
 *
 * `>` al principio abre el **modo "ir a"**: los diez destinos, los proyectos y
 * las notas por su contenido. Es la otra mitad de lo que ⌘K significa en
 * cualquier otra herramienta.
 */
export function CommandPalette({
  projects,
  onClose,
  onOpenProject,
  onNavigate,
  onOpenNote,
}: {
  projects: Project[];
  onClose: () => void;
  /** ⇧↵ guarda y abre el proyecto, si la captura tenía uno. */
  onOpenProject: (p: Project) => void;
  /** Modo "ir a": saltar a una vista del dashboard. */
  onNavigate: (view: DashboardView) => void;
  /** Modo "ir a": abrir una nota concreta (y su sección). */
  onOpenNote: (noteId: string, sectionId: string | null) => void;
}) {
  const t = useTranslations("commandPalette");
  const tTabs = useTranslations("tabs");
  const locale = useLocale();

  const restored = useRef(readDraft());
  const [kind, setKind] = useState<CaptureKind>(restored.current?.kind ?? "task");
  const [text, setText] = useState(restored.current?.text ?? "");
  const [extra, setExtra] = useState(restored.current?.extra ?? "");
  const [showExtra, setShowExtra] = useState(Boolean(restored.current?.extra));
  const [caret, setCaret] = useState(text.length);
  const [highlight, setHighlight] = useState(0);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<Element | null>(null);

  const { save, undo, flush } = useQuickCapture(projects);

  const goto = text.startsWith(">");
  const gotoQuery = goto ? text.slice(1).trim() : "";

  // Las notas solo se traen cuando de verdad se van a buscar: los cuerpos
  // pesan y abrir ⌘K para escribir una tarea no debería descargarlos.
  const { data: notesData } = useQuery<{ quickNotes: QuickNote[] }>(
    QUICK_NOTES_QUERY,
    { skip: !goto, fetchPolicy: "cache-first" }
  );

  const parsed = useMemo(() => quickParse(text, projects), [text, projects]);
  const effectiveKind = parsed.kind ?? kind;
  const canBlock = effectiveKind === "task";
  const needsProject = effectiveKind === "update";
  const ready =
    parsed.title.length > 0 && (!needsProject || parsed.projectId !== null);

  // ------------------------------------------------------------ sugerencias

  const token = useMemo(
    () => (goto ? null : activeToken(text, caret)),
    [goto, text, caret]
  );
  const suggestions = useMemo(
    () =>
      token?.sigil === "#" ? projectSuggestions(token.query, projects) : [],
    [token, projects]
  );

  const results = useMemo<GotoResult[]>(() => {
    if (!goto) return [];
    const needle = gotoQuery.toLowerCase();
    const matchesView = (v: DashboardView) =>
      needle === "" || tTabs(v).toLowerCase().includes(needle);

    const views: GotoResult[] = VIEWS.filter(matchesView)
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((view) => ({ kind: "view", id: `view:${view}`, view }));

    if (!needle) return views;

    const matchedProjects: GotoResult[] = projectSuggestions(
      gotoQuery,
      projects,
      MAX_RESULTS_PER_GROUP
    ).map((project) => ({
      kind: "project",
      id: `project:${project.id}`,
      project,
    }));

    const noteHits: GotoResult[] = searchSections(
      notesData?.quickNotes ?? [],
      gotoQuery
    )
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((hit) => ({
        kind: "note",
        id: `note:${hit.note.id}:${hit.section?.id ?? "-"}`,
        hit,
      }));

    return [...views, ...matchedProjects, ...noteHits];
  }, [goto, gotoQuery, notesData, projects, tTabs]);

  const options = goto ? results.length : suggestions.length;

  useEffect(() => {
    setHighlight(0);
  }, [text, caret]);

  // ------------------------------------------------------- foco y borrador

  useEffect(() => {
    returnFocusTo.current = document.activeElement;
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(text.length, text.length);
    void flush();
    return () => {
      // Devolver el foco a donde estaba: si ⌘K se abrió desde una fila, el
      // teclado tiene que volver a esa fila, no al principio del documento.
      if (returnFocusTo.current instanceof HTMLElement) {
        returnFocusTo.current.focus();
      }
    };
    // Solo al montar: el efecto es "abrir la captura", no "reaccionar al texto".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveDraft({ kind, text, extra });
  }, [kind, text, extra]);

  // ------------------------------------------------------------- acciones

  const applyText = (next: string, nextCaret?: number) => {
    setText(next);
    const at = nextCaret ?? next.length;
    setCaret(at);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(at, at);
    });
  };

  const acceptSuggestion = (project: Project) => {
    if (!token) return;
    const next = replaceToken(text, token, projectToken(project.name));
    applyText(next.text, next.caret);
  };

  const runGoto = (result: GotoResult) => {
    clearDraft();
    if (result.kind === "view") onNavigate(result.view);
    else if (result.kind === "project") onOpenProject(result.project);
    else onOpenNote(result.hit.note.id, result.hit.section?.id ?? null);
    onClose();
  };

  const announceSaved = useCallback(
    (saved: SavedCapture, project: Project | null) => {
      toast.withActions(
        "success",
        {
          // Dos claves en vez de un ICU con el nombre vacío: "Tarea guardada
          // en " con la frase colgando es peor que no decir dónde.
          messageKey: project
            ? `commandPalette.savedIn.${saved.kind}`
            : `commandPalette.saved.${saved.kind}`,
          values: { project: project?.name ?? "" },
        },
        [
          {
            labelKey: "commandPalette.undo",
            run: async () => {
              const ok = await undo(saved);
              if (ok) toast.successKey("commandPalette.undone");
            },
          },
          ...(project
            ? [
                {
                  labelKey: "commandPalette.open",
                  run: () => onOpenProject(project),
                },
              ]
            : []),
        ]
      );
    },
    [onOpenProject, undo]
  );

  const commit = async (openAfter: boolean) => {
    if (!ready || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const outcome = await save({
        kind: effectiveKind,
        title: parsed.title,
        projectId: parsed.projectId,
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        durationMinutes: parsed.durationMinutes,
        blocker: canBlock && parsed.blocked ? parsed.blockerReason : "",
        extra,
        token: newToken(),
        raw: text,
      });

      if (outcome.status === "invalid") {
        setFailed(true);
        return;
      }
      if (outcome.status === "queued") {
        // No es un error del usuario ni hay nada que rehacer: la línea ya está
        // a salvo y se manda sola. Se cierra igual que si hubiera entrado.
        toast.infoKey("commandPalette.queued");
      } else {
        announceSaved(outcome.saved, parsed.project);
        if (openAfter && parsed.project) onOpenProject(parsed.project);
      }

      clearDraft();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  /**
   * ⌘↵ — que lo lea el modelo. Devuelve la línea **reescrita con la sintaxis
   * de la captura**, no unos campos invisibles: así se ve qué entendió, se
   * puede corregir a mano y de paso se aprende el idioma de tokens.
   */
  const interpret = async () => {
    const raw = text.trim();
    if (!raw || aiBusy) return;
    setAiBusy(true);
    try {
      const draft = await parseCapture(raw, effectiveKind);
      const project =
        projects.find((p) => p.id === draft.project_id) ?? null;
      applyText(
        composeCaptureLine({
          title: draft.title,
          project,
          dueDate: draft.due_date,
          dueTime: draft.due_time,
          durationMinutes: draft.duration_minutes,
          blocker: draft.blocker,
        })
      );
      setKind(draft.kind);
      if (draft.why) {
        setExtra(draft.why);
        setShowExtra(true);
      }
    } catch (err) {
      if (err instanceof CapturePlanError) {
        toast.infoKey("commandPalette.ai.planRequired");
      } else {
        toast.errorKey("commandPalette.ai.failed");
      }
    } finally {
      setAiBusy(false);
    }
  };

  // ------------------------------------------------------------- teclado

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    // Foco atrapado dentro del diálogo, pero sin robarle TAB a nadie: se
    // tabula por los controles del overlay y se vuelve al principio.
    if (e.key === "Tab" && !(options > 0 && !e.shiftKey && token)) {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, textarea, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
      return;
    }

    if ((e.metaKey || e.ctrlKey) && /^[1-4]$/.test(e.key)) {
      e.preventDefault();
      setKind(CAPTURE_KINDS[Number(e.key) - 1]);
      return;
    }

    if (e.key === "ArrowDown" && options > 0) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % options);
      return;
    }
    if (e.key === "ArrowUp" && options > 0) {
      e.preventDefault();
      setHighlight((h) => (h - 1 + options) % options);
      return;
    }

    if (e.key === "Tab" && token && suggestions.length > 0) {
      e.preventDefault();
      acceptSuggestion(suggestions[highlight] ?? suggestions[0]);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (goto) {
        const chosen = results[highlight];
        if (chosen) runGoto(chosen);
        return;
      }
      if (e.metaKey || e.ctrlKey) {
        void interpret();
        return;
      }
      if (suggestions.length > 0 && token) {
        acceptSuggestion(suggestions[highlight] ?? suggestions[0]);
        return;
      }
      void commit(e.shiftKey);
    }
  };

  // ------------------------------------------------------------- pintado

  const dateLabel = useMemo(() => {
    if (!parsed.dueDate && !parsed.dueTime) return "";
    const date = parsed.dueDate
      ? new Date(`${parsed.dueDate}T00:00:00`).toLocaleDateString(locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : t("today");
    return parsed.dueTime ? `${date} · ${parsed.dueTime}` : date;
  }, [locale, parsed.dueDate, parsed.dueTime, t]);

  const gotoLabel = (result: GotoResult): string => {
    if (result.kind === "view") return tTabs(result.view);
    if (result.kind === "project") return result.project.name;
    return result.hit.heading || result.hit.note.title;
  };

  const gotoDetail = (result: GotoResult): string => {
    if (result.kind === "view") return t("goto.view");
    if (result.kind === "project") return t("goto.project");
    return result.hit.note.title;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-start justify-center p-0 sm:p-4 sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div className="absolute inset-0 bg-scrim" onClick={onClose} />

      <div
        ref={dialogRef}
        className="relative w-full sm:max-w-xl bg-surface border border-border rounded-t-lg sm:rounded-lg shadow-hard-lg overflow-hidden max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Tipos. Se pueden clicar, pero el camino previsto es ⌘1..⌘4 o /tipo. */}
        <div className="flex items-center gap-1 px-3 pt-3">
          {CAPTURE_KINDS.map((k, i) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                inputRef.current?.focus();
              }}
              aria-current={effectiveKind === k}
              disabled={goto}
              title={`${t(`kind.${k}`)} · ⌘${i + 1}`}
              className={`px-2.5 py-1 rounded-md transition-colors duration-150 ease-out disabled:opacity-40 ${
                effectiveKind === k && !goto
                  ? "bg-accent-a12 text-accent"
                  : "text-text-4 hover:text-text-2"
              }`}
            >
              <Meta variant="cintillo" tone="inherit">
                {t(`kind.${k}`)}
              </Meta>
            </button>
          ))}
          <Meta tone="faint" className="ml-auto pr-1">
            {goto ? t("goto.mode") : t("gotoHint")}
          </Meta>
        </div>

        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setCaret(e.target.selectionStart ?? e.target.value.length);
            setFailed(false);
          }}
          onKeyUp={(e) =>
            setCaret((e.target as HTMLInputElement).selectionStart ?? 0)
          }
          onClick={(e) =>
            setCaret((e.target as HTMLInputElement).selectionStart ?? 0)
          }
          onKeyDown={onKeyDown}
          placeholder={goto ? t("goto.placeholder") : t(`placeholder.${effectiveKind}`)}
          aria-label={goto ? t("goto.mode") : t(`kind.${effectiveKind}`)}
          role="combobox"
          aria-expanded={options > 0}
          aria-controls="capture-options"
          aria-autocomplete="list"
          className="w-full bg-transparent px-4 py-4 text-[17px] text-text placeholder:text-text-off outline-none"
        />

        {/* Segunda línea: el `why` de una idea o el cuerpo de una nota. El
            modelo la trata como campo aparte, así que la captura también. */}
        {!goto && (effectiveKind === "idea" || effectiveKind === "note") && (
          <div className="px-4 pb-2">
            {showExtra ? (
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    onClose();
                  }
                }}
                rows={2}
                placeholder={t(`extra.${effectiveKind}`)}
                aria-label={t(`extra.${effectiveKind}`)}
                className="w-full bg-well border border-line-08 rounded-md px-3 py-2 text-sm text-text placeholder:text-text-off outline-none focus:border-line-22"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowExtra(true)}
                className="text-text-4 hover:text-text-2 transition-colors duration-150 ease-out"
              >
                <Meta variant="cintillo" tone="inherit">
                  {t(`extraToggle.${effectiveKind}`)}
                </Meta>
              </button>
            )}
          </div>
        )}

        {/* Sugerencias de proyecto · resultados de "ir a". */}
        {options > 0 && (
          <ul
            id="capture-options"
            role="listbox"
            className="border-t border-line-08 max-h-64 overflow-y-auto"
          >
            {goto
              ? results.map((result, i) => (
                  <li key={result.id} role="option" aria-selected={i === highlight}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => runGoto(result)}
                      className={`w-full text-left px-4 py-2 flex items-baseline gap-2 transition-colors duration-150 ease-out ${
                        i === highlight ? "bg-accent-a12" : "hover:bg-surface-2"
                      }`}
                    >
                      <span className="text-sm text-text truncate">
                        {gotoLabel(result)}
                      </span>
                      <Meta tone="faint" className="ml-auto shrink-0">
                        {gotoDetail(result)}
                      </Meta>
                    </button>
                  </li>
                ))
              : suggestions.map((project, i) => (
                  <li key={project.id} role="option" aria-selected={i === highlight}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => acceptSuggestion(project)}
                      className={`w-full text-left px-4 py-2 flex items-baseline gap-2 transition-colors duration-150 ease-out ${
                        i === highlight ? "bg-accent-a12" : "hover:bg-surface-2"
                      }`}
                    >
                      <span className="text-sm text-text truncate">
                        {project.name}
                      </span>
                    </button>
                  </li>
                ))}
          </ul>
        )}

        {/* Lo que se va a guardar, resuelto en vivo. */}
        {!goto && (
          <div
            className="px-4 pb-3 min-h-[1.5rem] flex items-center gap-2 flex-wrap"
            aria-live="polite"
          >
            {parsed.project && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-accent-a12 border border-accent-a35">
                <Meta variant="cintillo" tone="inherit" className="text-accent">
                  {`# ${parsed.project.name}`}
                </Meta>
              </span>
            )}
            {dateLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-line-22">
                <Meta variant="cintillo" tone="inherit" className="text-text-2">
                  {dateLabel}
                </Meta>
              </span>
            )}
            {parsed.durationMinutes !== null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-line-22">
                <Meta variant="cintillo" tone="inherit" className="text-text-2">
                  {t("duration", { minutes: parsed.durationMinutes })}
                </Meta>
              </span>
            )}
            {canBlock && parsed.blocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-signal-a50 text-signal">
                <span aria-hidden="true">✕</span>
                <Meta variant="cintillo" tone="inherit">
                  {parsed.blockerReason || t("blockedNoReason")}
                </Meta>
              </span>
            )}
            {needsProject && !parsed.projectId && (
              <Meta tone="faint">{t("updateNeedsProject")}</Meta>
            )}
            {parsed.unresolved.length > 0 && (
              <Meta tone="faint">
                {t("unresolved", { tokens: parsed.unresolved.join(" ") })}
              </Meta>
            )}
            {failed && <Meta tone="faint">{t("failed")}</Meta>}
          </div>
        )}

        {/* Empate de proyecto: se pregunta en vez de elegir por el usuario. */}
        {!goto && parsed.projectCandidates.length > 0 && (
          <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
            <Meta tone="faint">{t("ambiguous")}</Meta>
            {parsed.projectCandidates.slice(0, 4).map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => {
                  // El token del empate es el primer `#` **sin escapar**:
                  // buscar por `indexOf("#")` cogería un `##literal` previo.
                  const match = text.match(/(^|\s)#(?!#)/);
                  if (match?.index === undefined) return;
                  const at = activeToken(
                    text,
                    match.index + match[1].length + 1
                  );
                  if (!at) return;
                  const next = replaceToken(
                    text,
                    at,
                    projectToken(candidate.name)
                  );
                  applyText(next.text, next.caret);
                }}
                className="px-2 py-0.5 rounded-sm border border-line-22 text-text-2 hover:border-accent hover:text-accent transition-colors duration-150 ease-out"
              >
                <Meta variant="cintillo" tone="inherit">
                  {candidate.name}
                </Meta>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-line-08">
          <Meta tone="faint">{goto ? t("goto.hints") : t("hints")}</Meta>
          <div className="flex items-center gap-2">
            {!goto && (
              <button
                type="button"
                onClick={() => void interpret()}
                disabled={aiBusy || text.trim().length === 0}
                title={t("ai.tooltip")}
                className="px-2.5 py-1.5 text-sm rounded-md border border-line-22 text-text-2 hover:border-accent hover:text-accent transition-colors duration-150 ease-out disabled:opacity-40"
              >
                {aiBusy ? t("ai.working") : t("ai.button")}
              </button>
            )}
            {!goto && (
              <button
                type="button"
                onClick={() => void commit(false)}
                disabled={!ready || busy}
                className="px-3 py-1.5 text-sm rounded-md bg-accent text-bg font-medium transition-colors duration-150 ease-out hover:bg-accent-hi disabled:opacity-40"
              >
                {t("save")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
