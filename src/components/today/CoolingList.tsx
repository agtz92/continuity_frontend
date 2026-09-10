"use client";

import { useTranslations } from "next-intl";

import type { Project } from "@/lib/types";
import type { CoolingEntry } from "@/lib/homeSignals";
import { projectCooling } from "@/lib/cooling";
import { Spine } from "../ui/Spine";
import { Meta } from "../ui/Meta";

/**
 * "Se están enfriando" — lo que lleva días sin moverse, lo más frío arriba.
 *
 * El enfriamiento se dice con **el peso de la tinta**, no con una alarma: un
 * proyecto frío no es una emergencia, es algo que se está apagando en silencio.
 * Por eso el contador se apaga en vez de encenderse, y el bloque no tiene ni
 * icono de aviso ni color de señal.
 */
/** Días tras los que el backend marca un proyecto como estancado y te pregunta
 *  si sigue vivo. Debe coincidir con `detect_stalled_projects` en el servidor. */
const STALLED_DAYS = 14;

export function CoolingList({
  entries,
  onJumpToProject,
  onLogUpdate,
}: {
  entries: CoolingEntry[];
  onJumpToProject: (p: Project) => void;
  onLogUpdate: (p: Project) => void;
}) {
  const t = useTranslations("views.today.cooling");

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-2">
        <Meta variant="cintillo" tone="muted">
          {t("title")}
        </Meta>
      </div>

      <div className="divide-y divide-line-08 border-y border-line-08">
        {entries.map(({ project: p, days }) => (
          <div
            key={p.id}
            className="relative pl-3 py-2.5 flex items-center gap-3 group"
          >
            <Spine status={p.status} priority={p.priority} />
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onJumpToProject(p)}
                className="block text-sm font-medium text-text hover:text-accent transition-colors duration-150 ease-out truncate max-w-full text-left"
              >
                {p.name}
              </button>
              {p.nextStep && (
                <p className="text-xs text-text-4 truncate">
                  <span className="text-text-5">→ </span>
                  {p.nextStep}
                </p>
              )}
            </div>
            {/* Frío = tinta plena; templado = tinta apagada. */}
            <Meta
              variant="dato"
              tone={projectCooling(p) === "cold" ? "muted" : "faint"}
              className="shrink-0"
            >
              {t("days", { count: days })}
            </Meta>
            <button
              type="button"
              onClick={() => onLogUpdate(p)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-md border border-border text-text-3 hover:text-text sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              {t("resume")}
            </button>
          </div>
        ))}
      </div>

      {/* El aviso del artboard, con el número REAL: el cron marca `stalled` a
          los 14 días, no a los 45. Dos números distintos para lo mismo son un
          número mentiroso. */}
      <Meta variant="cintillo" tone="faint" className="block mt-2">
        {t("stalledPromise", { count: STALLED_DAYS })}
      </Meta>
    </section>
  );
}
