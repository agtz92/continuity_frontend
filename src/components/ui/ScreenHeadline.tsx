/**
 * Titular con la cifra, espejo del `ScreenHeadline` de móvil: la cifra de lo
 * que sigue en juego arriba ("24 vivos.") y, en una segunda fila, el otro
 * estado ("3 detenidos · 2 atrasados.").
 *
 * - La segunda fila va en `signal` cuando nombra algo atrasado o bloqueado, y
 *   en tinta apagada cuando todo va al día. Quien llama decide el tono.
 * - El título de la pantalla queda solo para lectores de pantalla.
 * - Nunca se corta: envuelve.
 */
/** Une las cifras de la segunda fila: "3 detenidos · 2 atrasados." Las
 *  partes llegan sin punto; las falsas se descartan. */
export function joinHeadlineParts(parts: Array<string | false>): string {
  return `${parts.filter(Boolean).join(" · ")}.`;
}

export function ScreenHeadline({
  title,
  primary,
  secondary,
  secondaryTone = "muted",
}: {
  /** Nombre de la pantalla, solo para lectores de pantalla. */
  title: string;
  primary: string;
  /** `null` omite la segunda fila. */
  secondary?: string | null;
  secondaryTone?: "muted" | "signal";
}) {
  return (
    <h2 className="min-w-0">
      <span className="sr-only">{title}</span>
      <span
        aria-hidden="true"
        className="font-display-app font-semibold text-[34px] leading-[36px] tracking-[-0.03em] text-text block"
      >
        {primary}
        {secondary && (
          <span
            className={`block ${secondaryTone === "signal" ? "text-signal" : "text-text-4"}`}
          >
            {secondary}
          </span>
        )}
      </span>
    </h2>
  );
}
