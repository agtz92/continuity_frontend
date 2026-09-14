"use client";

import { forwardRef } from "react";
import { useTranslations } from "next-intl";

/**
 * La ficha del tour (variante 1a del handoff): numeral en display, espina de
 * acento al borde y el texto debajo.
 *
 * **No conoce ningún paso.** Recibe el número, el texto y tres callbacks. Eso
 * es lo que permite que el guion viva entero en `steps.ts`: si mañana el tour
 * tiene catorce pasos, este archivo no se entera.
 *
 * Gemela de `continuity-mobile/src/components/onboarding/tour/TourCard.tsx`.
 */
export const TourCard = forwardRef<
  HTMLDivElement,
  {
    /** Base 0. La ficha lo presenta en base 1, con cero a la izquierda. */
    index: number;
    total: number;
    title: string;
    body: string;
    onNext: () => void;
    /** Ausente en el primer paso: no hay a dónde volver. */
    onBack?: () => void;
    onSkip: () => void;
    style?: React.CSSProperties;
  }
>(function TourCard(
  { index, total, title, body, onNext, onBack, onSkip, style },
  ref,
) {
  const t = useTranslations("onboarding.tour");
  const last = index === total - 1;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      style={style}
      className="fixed z-[70] flex overflow-hidden rounded-lg border border-border bg-surface shadow-hard-lg transition-[top,left] duration-150 ease-out motion-reduce:transition-none"
    >
      {/* La espina. 3px, acento: esto es lo que pide tu atención ahora. */}
      <span aria-hidden="true" className="w-[3px] shrink-0 bg-accent" />

      <div className="min-w-0 flex-1 p-5">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-display-app text-[22px] leading-none tracking-tight tabular-nums text-text-5">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-text-5">
            / {String(total).padStart(2, "0")}
          </span>
        </div>

        <h2
          id="tour-title"
          className="mb-2 font-display-app text-2xl tracking-tight text-text text-balance"
        >
          {title}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-text-2">{body}</p>

        {/* Una marca por paso, contables. Mismo lenguaje que el progreso de
            tareas: bloques, no barra. */}
        <div className="mb-4 flex gap-0.5" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 ${i <= index ? "bg-accent" : "bg-line-14"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-text-muted transition-colors hover:text-text"
            >
              {t("skip")}
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-text-muted transition-colors hover:text-text"
              >
                {t("back")}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onNext}
            autoFocus
            className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            {t(last ? "done" : "next")}
          </button>
        </div>
      </div>
    </div>
  );
});
