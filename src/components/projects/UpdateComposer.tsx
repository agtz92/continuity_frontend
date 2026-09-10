"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useNoteMutations } from "@/hooks/useNoteMutations";
import { Meta } from "../ui/Meta";

/**
 * El composer de update, inline en la bitácora del proyecto.
 *
 * El diseño lo pone ahí por una razón concreta: escribir el update es **la**
 * acción del detalle, y hoy exige abrir un modal encima del modal. Aquí se
 * escribe donde se lee, y ⌘↵ guarda sin levantar las manos del teclado.
 *
 * **No sustituye a `NoteModal`.** Ese sigue siendo la vía desde el Home y desde
 * la lista de dormidos, donde no hay bitácora a la vista. Añadir aquí no quita
 * allá — y si esto no convence, se borra el componente y la bitácora sigue
 * teniendo su botón de siempre.
 */
export function UpdateComposer({
  projectId,
  onSaved,
}: {
  projectId: string;
  onSaved?: () => void;
}) {
  const t = useTranslations("views.projects.composer");
  const { addNote } = useNoteMutations();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const body = note.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      if (await addNote(projectId, body)) {
        setNote("");
        onSaved?.();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-surface px-3 py-2.5">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          // ⌘↵ / Ctrl+↵ guarda. Enter a secas sigue siendo salto de línea: un
          // update es prosa, no un mensaje de chat.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder={t("placeholder")}
        rows={3}
        aria-label={t("ariaLabel")}
        className="w-full bg-transparent text-[15px] leading-[1.6] text-text placeholder:text-text-off resize-y outline-none"
      />
      <div className="flex items-center justify-between gap-2 mt-1">
        <Meta tone="faint">{t("hint")}</Meta>
        <button
          type="button"
          onClick={submit}
          disabled={!note.trim() || busy}
          className="px-3 py-1.5 text-sm rounded-md bg-accent text-bg font-medium transition-colors duration-150 ease-out hover:bg-accent-hi disabled:opacity-40"
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}
