import { useTranslations } from "next-intl";

import { Meta } from "./Meta";

/**
 * Progreso en bloques, no en barra continua: cada marca es una tarea, así que
 * el usuario puede contarlas. Las bloqueadas se pintan con la señal, de modo
 * que "7 de 12, y tres de las que faltan están detenidas" se lee de un vistazo.
 *
 * Por encima de MAX_TICKS la lectura de bloques deja de ser contable y se cae
 * a una barra proporcional — el bloque de 12px dejaría de caber en la fila.
 */
const MAX_TICKS = 24;

export function ProgressTicks({
  done,
  total,
  blocked = 0,
  showLabel = true,
  className = "",
}: {
  done: number;
  total: number;
  /** Tareas abiertas con blocker. Se pintan aparte de las pendientes. */
  blocked?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const t = useTranslations("progressTicks");
  if (total <= 0) return null;

  const pct = Math.round((done / total) * 100);
  const label = (
    <Meta className="shrink-0">{t("label", { done, total, pct })}</Meta>
  );

  if (total > MAX_TICKS) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="h-[6px] flex-1 min-w-[64px] bg-line-08 overflow-hidden">
          <span className="block h-full bg-accent" style={{ width: `${pct}%` }} />
        </span>
        {showLabel && label}
      </div>
    );
  }

  // done → acento · bloqueada → señal · pendiente → regla.
  const blockedOpen = Math.min(blocked, Math.max(total - done, 0));
  const ticks = Array.from({ length: total }, (_, i) => {
    if (i < done) return "bg-accent";
    if (i < done + blockedOpen) return "bg-signal";
    return "bg-line-14";
  });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="flex gap-[2px]"
        role="img"
        aria-label={
          blockedOpen
            ? t("ariaBlocked", { done, total, blocked: blockedOpen })
            : t("aria", { done, total })
        }
      >
        {ticks.map((tone, i) => (
          <span key={i} className={`w-[12px] h-[6px] ${tone}`} />
        ))}
      </span>
      {showLabel && label}
    </div>
  );
}
