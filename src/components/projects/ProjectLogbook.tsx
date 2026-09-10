"use client";

import { useLocale, useTranslations } from "next-intl";
import { Edit2, X } from "lucide-react";

import type { Activity } from "@/lib/types";
import { Meta } from "../ui/Meta";

/**
 * La bitácora del proyecto **como lectura**, no como lista de eventos.
 *
 * Es el mismo lenguaje que el diario global (S15): un update escrito pesa —
 * párrafo de 15px, interlineado de lectura, ancho acotado a 68 caracteres —
 * y la fecha se aparta a un lado en versalitas. Sin cards, sin bullets: lo
 * que escribiste se relee, y para eso tiene que parecer prosa.
 */
export function ProjectLogbook({
  updates,
  onEdit,
  onDelete,
}: {
  updates: Activity[];
  onEdit?: (a: Activity) => void;
  onDelete?: (id: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.projects.logbook");
  const locale = useLocale();

  if (updates.length === 0) {
    return <Meta tone="faint">{t("empty")}</Meta>;
  }

  const sorted = [...updates].sort((a, b) => b.created.localeCompare(a.created));

  return (
    <div className="divide-y divide-line-08 border-y border-line-08">
      {sorted.map((a) => (
        <article key={a.id} className="flex gap-3 py-4 group">
          <Meta tone="faint" className="shrink-0 w-20 tabular-nums pt-1">
            {new Date(a.created).toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Meta>
          <p className="flex-1 min-w-0 text-[15px] leading-[1.6] text-text-2 break-words whitespace-pre-line max-w-[68ch]">
            {a.note}
          </p>
          {(onEdit || onDelete) && (
            <div className="flex items-start gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 ease-out">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className="text-text-4 hover:text-accent"
                  aria-label={t("editAria")}
                >
                  <Edit2 size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t("deleteConfirm"))) void onDelete(a.id);
                  }}
                  className="text-text-4 hover:text-signal"
                  aria-label={t("deleteAria")}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
