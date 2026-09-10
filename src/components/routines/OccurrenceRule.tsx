import { useLocale, useTranslations } from "next-intl";

import type { OccurrenceMark } from "@/lib/routineHistory";
import { hasNoFutureOccurrences } from "@/lib/routineHistory";
import { Meta } from "../ui/Meta";

/**
 * La regla de ocurrencias: un bloque por vez que tocaba, del más viejo al más
 * nuevo. Una rutina no se completa, se sostiene — y lo que hay que poder leer
 * de un vistazo es la continuidad, no un porcentaje.
 *
 *   hecha      → bloque sólido de acento
 *   saltada    → bloque rayado (nunca solo color: tiene que leerse en escala
 *                de grises, REDISENO_PLAN.md §12.2)
 *   hoy        → bloque hueco de acento, aún vivo
 *   la próxima → bloque hueco de regla, separado por un hueco
 *
 * Todos los estados salen de `lib/routineHistory.ts`; aquí no se calcula nada.
 */

const BLOCK = "w-[8px] h-[14px] shrink-0";

const SKIPPED_HATCH = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--line-34) 0 2px, transparent 2px 4px)",
} as const;

function blockClass(state: OccurrenceMark["state"]): string {
  switch (state) {
    case "done":
      return "bg-accent";
    case "pending":
      return "shadow-[inset_0_0_0_1.5px_var(--accent)]";
    case "next":
      return "shadow-[inset_0_0_0_1px_var(--line-22)]";
    default:
      return "";
  }
}

export function OccurrenceRule({
  marks,
  streak,
  className = "",
}: {
  marks: OccurrenceMark[];
  /** Ocurrencias seguidas. Real y contada, nunca estimada. */
  streak: number;
  className?: string;
}) {
  const t = useTranslations("occurrenceRule");
  const locale = useLocale();

  if (marks.length === 0) return null;

  const fmt = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString(locale);
  const done = marks.filter((m) => m.state === "done").length;
  const skipped = marks.filter((m) => m.state === "skipped").length;
  const next = marks.find((m) => m.state === "next");
  const dormant = hasNoFutureOccurrences(marks);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span
        className="flex items-center gap-[2px]"
        role="img"
        aria-label={t("aria", { done, skipped })}
      >
        {marks.map((m) => (
          <span
            key={m.date}
            // El hueco antes de la próxima separa lo hecho de lo que viene.
            className={`${BLOCK} ${blockClass(m.state)} ${
              m.state === "next" ? "ml-2" : ""
            }`}
            style={m.state === "skipped" ? SKIPPED_HATCH : undefined}
            title={`${fmt(m.date)} · ${t(`state.${m.state}`)}`}
          />
        ))}
      </span>
      {streak > 0 && <Meta variant="dato">{t("streak", { count: streak })}</Meta>}
      {dormant ? (
        <Meta tone="faint">{t("noneScheduled")}</Meta>
      ) : next ? (
        <Meta tone="faint">{t("next", { date: fmt(next.date) })}</Meta>
      ) : null}
    </div>
  );
}
