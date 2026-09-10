"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";

import type { Project } from "@/lib/types";
import {
  ADD_TASK_BLOCKER,
  CREATE_TASK,
  DASHBOARD_QUERY,
} from "@/lib/graphql";
import { useIdeaMutations } from "@/hooks/useIdeaMutations";
import { useNoteMutations } from "@/hooks/useNoteMutations";
import { useQuickNoteMutations } from "@/hooks/useQuickNoteMutations";
import { quickParse } from "@/lib/quickParse";
import { Meta } from "./Meta";

const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

/** Los cuatro tipos que se pueden capturar. TAB rota entre ellos. */
const KINDS = ["task", "idea", "note", "update"] as const;
type Kind = (typeof KINDS)[number];

/**
 * Captura rápida (⌘K).
 *
 * Una línea, sin ratón: `#` elige proyecto, `!` marca bloqueo con su razón,
 * TAB cambia de tipo, ↵ guarda, ESC cancela. El parser vive aparte
 * (`lib/quickParse.ts`) y está cubierto por tests — es lo que decide qué acaba
 * siendo el título, y equivocarse ahí es perder texto en silencio.
 *
 * **Lo que se muestra bajo el campo es lo que se va a guardar**, resuelto en
 * vivo: el nombre real del proyecto y la razón del bloqueo. Sin eso, `#` y `!`
 * serían magia con la que no se puede contar.
 *
 * `!` solo aplica a tareas: es lo único que tiene blockers en el modelo. En los
 * otros tipos el texto se queda tal cual, sin fingir que hizo algo.
 */
export function CommandPalette({
  projects,
  onClose,
  onOpenProject,
}: {
  projects: Project[];
  onClose: () => void;
  /** ⇧↵ guarda y abre el proyecto, si la captura tenía uno. */
  onOpenProject: (p: Project) => void;
}) {
  const t = useTranslations("commandPalette");
  const [kind, setKind] = useState<Kind>("task");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [createTask] = useMutation(CREATE_TASK, refetchAfter);
  const [addBlocker] = useMutation(ADD_TASK_BLOCKER, refetchAfter);
  const { saveIdea } = useIdeaMutations();
  const { addNote } = useNoteMutations();
  const { createNote } = useQuickNoteMutations();

  const parsed = useMemo(() => quickParse(text, projects), [text, projects]);
  const canBlock = kind === "task";
  // Un update es un renglón en la bitácora de UN proyecto: sin `#` no hay dónde
  // escribirlo, así que el guardado se bloquea en vez de inventar destino.
  const needsProject = kind === "update";
  const ready =
    parsed.title.length > 0 && (!needsProject || parsed.projectId !== null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const save = async (openAfter: boolean) => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      let ok = false;
      if (kind === "task") {
        const res = await createTask({
          variables: {
            data: {
              title: parsed.title,
              projectId: parsed.projectId,
              dueDate: null,
              done: false,
              effortHours: null,
              dueTime: null,
              durationMinutes: null,
            },
          },
        });
        const id = (res.data as { createTask?: { id?: string } } | null)
          ?.createTask?.id;
        ok = Boolean(id);
        // El blocker va después porque necesita el id de la tarea recién creada.
        if (ok && id && parsed.blocked) {
          await addBlocker({
            variables: {
              data: {
                blockedTaskId: id,
                externalDescription: parsed.blockerReason,
              },
            },
          });
        }
      } else if (kind === "idea") {
        ok = await saveIdea({ title: parsed.title, description: "", why: "" });
      } else if (kind === "note") {
        ok = (await createNote({ title: parsed.title })) !== null;
      } else {
        ok = parsed.projectId
          ? await addNote(parsed.projectId, parsed.title)
          : false;
      }

      if (!ok) return;
      if (openAfter && parsed.project) onOpenProject(parsed.project);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const dir = e.shiftKey ? -1 : 1;
      const i = KINDS.indexOf(kind);
      setKind(KINDS[(i + dir + KINDS.length) % KINDS.length]);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      void save(e.shiftKey);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div className="absolute inset-0 bg-scrim" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-surface border border-border rounded-lg shadow-hard-lg overflow-hidden">
        {/* Tipos. Se pueden clicar, pero el camino previsto es TAB. */}
        <div className="flex items-center gap-1 px-3 pt-3">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                inputRef.current?.focus();
              }}
              aria-current={kind === k}
              className={`px-2.5 py-1 rounded-md transition-colors duration-150 ease-out ${
                kind === k
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
            {t("tabHint")}
          </Meta>
        </div>

        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t(`placeholder.${kind}`)}
          aria-label={t(`kind.${kind}`)}
          className="w-full bg-transparent px-4 py-4 text-[17px] text-text placeholder:text-text-off outline-none"
        />

        {/* Lo que se va a guardar, resuelto en vivo. */}
        <div className="px-4 pb-3 min-h-[1.5rem] flex items-center gap-2 flex-wrap">
          {parsed.project && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-accent-a12 border border-accent-a35">
              <Meta variant="cintillo" tone="inherit" className="text-accent">
                # {parsed.project.name}
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
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-line-08">
          <Meta tone="faint">{t("hints")}</Meta>
          <button
            type="button"
            onClick={() => void save(false)}
            disabled={!ready || busy}
            className="px-3 py-1.5 text-sm rounded-md bg-accent text-bg font-medium transition-colors duration-150 ease-out hover:bg-accent-hi disabled:opacity-40"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
