"use client";

import { Pin } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Category, Project, QuickNote } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import { Meta } from "@/components/ui/Meta";

/**
 * El índice de notas: **una columna, siempre** (DP-17).
 *
 * Antes era una rejilla de tarjetas de una a tres columnas que se colapsaba al
 * abrir una nota. Dos estados para lo mismo, y el ancho de la tarjeta hacía que
 * doce notas ocuparan una pantalla entera. Ahora es una lista densa que no
 * cambia de forma: el índice se lee de arriba abajo y el editor vive al lado.
 *
 * Fila, no tarjeta: filete de 1px entre notas en vez de borde alrededor, y el
 * color de la categoría en una muesca de 3px a la izquierda — la misma muesca
 * que usan los chips de categoría en el resto del producto.
 */
export function NoteIndex({
  notes,
  categories,
  projects,
  selectedId,
  onSelect,
}: {
  notes: QuickNote[];
  categories: Category[];
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("views.quickNotes");

  return (
    <ul className="divide-y divide-line-08 border-y border-line-08">
      {notes.map((n) => {
        const cat = categories.find((c) => c.id === n.categoryId) ?? null;
        const proj = projects.find((p) => p.id === n.projectId) ?? null;
        const dot = cat ? categoryColorClass(cat.color).dot : "bg-line-14";
        const preview =
          n.sections.find((s) => s.body.trim())?.body.trim() ??
          n.sections.find((s) => s.heading.trim())?.heading.trim() ??
          "";
        const active = n.id === selectedId;

        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onSelect(n.id)}
              aria-current={active ? "true" : undefined}
              className={`relative w-full text-left pl-3 pr-2 py-2.5 transition-colors duration-150 ease-out ${
                active ? "bg-accent-a12" : "hover:bg-line-04"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] ${dot}`}
              />
              <span className="flex items-center gap-2">
                <span
                  className={`flex-1 min-w-0 truncate text-sm ${
                    active ? "text-text font-medium" : "text-text-2"
                  }`}
                >
                  {n.title.trim() || t("untitled")}
                </span>
                {n.pinned && (
                  <Pin size={12} className="text-accent shrink-0 fill-current" />
                )}
              </span>
              {preview && (
                <span className="block truncate text-xs text-text-4 mt-0.5">
                  {preview}
                </span>
              )}
              <span className="flex items-center gap-2 mt-1 min-w-0">
                {cat && <Meta tone="faint">{cat.name}</Meta>}
                {proj && (
                  <Meta tone="faint" className="truncate">
                    {proj.name}
                  </Meta>
                )}
                {!cat && !proj && <Meta tone="faint">{t("standalone")}</Meta>}
                <Meta variant="dato" tone="faint" className="ml-auto shrink-0">
                  {n.sections.length}
                </Meta>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
