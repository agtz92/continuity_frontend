import { useTranslations } from "next-intl";

import { Meta } from "./Meta";

/**
 * Badge de bloqueo. Trama diagonal + ✕ + días — **nunca solo color**: un
 * blocker tiene que distinguirse en una captura en escala de grises
 * (REDISENO_PLAN.md §12.2). El ✕ y la trama son la señal; el coral es refuerzo.
 *
 * `compact` deja solo "✕ Nd" para las filas densas del índice; la variante
 * completa añade la razón, que es lo que de verdad desatasca.
 */
export function BlockerBadge({
  since,
  reason,
  blocksCount,
  compact = false,
  label = false,
  className = "",
}: {
  /** Días que lleva abierto. */
  since: number;
  /** Por qué está detenido. La razón es el dato útil, no el estado. */
  reason?: string;
  /** Cuántas tareas arrastra bloqueadas. */
  blocksCount?: number;
  compact?: boolean;
  /** En `compact`, escribe la palabra además del ✕. */
  label?: boolean;
  className?: string;
}) {
  const t = useTranslations("blocker");
  const hatch = {
    backgroundImage:
      "repeating-linear-gradient(45deg, var(--signal-a12) 0 3px, transparent 3px 7px)",
  };

  if (compact) {
    // `label` añade la palabra: en una fila de proyecto un ✕ suelto se pierde,
    // y el artboard 02 la escribe ("✕ BLOQUEADO 9D").
    return (
      <span
        style={hatch}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-signal-a50 text-signal ${className}`}
      >
        <span aria-hidden="true">✕</span>
        <Meta variant={label ? "cintillo" : "dato"} tone="inherit">
          {label ? t("blocked") : null}
          {/* Un blocker abierto hoy no lleva días: "0D" se lee como un fallo. */}
          {label && since > 0 ? " " : null}
          {since > 0 ? `${since}D` : null}
        </Meta>
      </span>
    );
  }

  return (
    <div
      style={hatch}
      className={`border-l-[3px] border-signal pl-3 pr-3 py-2 ${className}`}
    >
      <div className="flex items-center gap-2 text-signal">
        <span aria-hidden="true">✕</span>
        <Meta variant="cintillo" tone="inherit">
          {since > 0 ? t("blockedDays", { count: since }) : t("blocked")}
        </Meta>
      </div>
      {reason && <p className="mt-1 text-sm text-text-2">{reason}</p>}
      {blocksCount ? (
        <Meta variant="cintillo" className="mt-1 block" tone="faint">
          {t("blocksTasks", { count: blocksCount })}
        </Meta>
      ) : null}
    </div>
  );
}
