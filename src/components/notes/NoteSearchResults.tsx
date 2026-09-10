"use client";

import { useTranslations } from "next-intl";

import type { SectionHit } from "@/lib/noteSearch";
import { Meta } from "@/components/ui/Meta";

/**
 * Resultados de búsqueda **por sección**.
 *
 * El resultado no es "esta nota contiene la palabra" —eso deja el trabajo de
 * encontrarla donde estaba— sino el trozo concreto: de qué nota es, qué sección
 * es, y una línea de contexto centrada en la coincidencia. Al pulsarlo se abre
 * la nota **y se salta a esa sección**.
 *
 * Una nota puede aparecer varias veces, una por sección que casa. Agruparlas
 * devolvería el problema original.
 */
export function NoteSearchResults({
  hits,
  query,
  onJump,
}: {
  hits: SectionHit[];
  query: string;
  onJump: (noteId: string, sectionId: string | null) => void;
}) {
  const t = useTranslations("views.quickNotes");

  if (hits.length === 0) {
    return (
      <div className="py-8 text-center">
        <Meta tone="faint">{t("noMatch", { query })}</Meta>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line-08 border-y border-line-08">
      {hits.map((h) => (
        <li key={`${h.note.id}-${h.section?.id ?? "title"}`}>
          <button
            type="button"
            onClick={() => onJump(h.note.id, h.section?.id ?? null)}
            className="w-full text-left px-3 py-2.5 hover:bg-line-04 transition-colors duration-150 ease-out"
          >
            <Meta variant="cintillo" tone="faint" className="block truncate">
              {h.note.title.trim() || t("untitled")}
              {h.heading ? ` · ${h.heading}` : ""}
            </Meta>
            {h.snippet && (
              <p className="text-xs leading-[1.5] text-text-2 mt-1 line-clamp-2 break-words">
                {h.snippet}
              </p>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
