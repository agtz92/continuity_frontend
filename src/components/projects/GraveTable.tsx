"use client";

import { HeartPulse } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { Project, Task } from "@/lib/types";
import { causeOfDeath, lifespanDays } from "@/lib/graveyard";
import { Spine, spineStrikesTitle } from "@/components/ui/Spine";
import { Meta } from "@/components/ui/Meta";
import { ProjectClosureNotes } from "./ProjectClosureNotes";

/**
 * El cementerio como **tabla**: `proyecto · vivió · murió de`.
 *
 * Antes era una pila de tarjetas con un borde rojo. La tabla hace lo que las
 * tarjetas no podían: poner los proyectos muertos en columna para que el patrón
 * se vea sin leer ninguno — tres seguidos con "nunca arrancó" dicen algo que
 * tres tarjetas separadas no dicen.
 *
 * **La tachadura separa abandonado de terminado.** Es la misma regla de la
 * espina que usa todo el producto (`spineStrikesTitle`): solo lo muerto se
 * tacha; lo archivado y lo lanzado, nunca. Aquí solo hay muertos, pero la regla
 * se toma de un sitio en vez de repetirse, para que no pueda divergir.
 *
 * "Murió de" **no es un dato**: se deriva en `lib/graveyard.ts`.
 */
export function GraveTable({
  killed,
  tasks,
  onRevive,
}: {
  killed: Project[];
  tasks: Task[];
  onRevive: (p: Project) => void;
}) {
  const t = useTranslations("views.graveyard");
  const locale = useLocale();

  return (
    <div className="divide-y divide-line-08 border-y border-line-08">
      <div className="hidden sm:flex items-center gap-3 px-3 py-1.5">
        <Meta variant="cintillo" tone="faint" className="flex-1">
          {t("colProject")}
        </Meta>
        <Meta variant="cintillo" tone="faint" className="w-20 text-right">
          {t("colLived")}
        </Meta>
        <Meta variant="cintillo" tone="faint" className="w-40">
          {t("colDiedOf")}
        </Meta>
        <span className="w-[88px]" />
      </div>

      {killed.map((p) => {
        const cause = causeOfDeath(p, tasks);
        return (
          <details key={p.id} className="group">
            <summary className="relative flex items-center gap-3 px-3 py-2.5 cursor-pointer list-none hover:bg-line-04 transition-colors duration-150 ease-out">
              <Spine status={p.status} priority={p.priority} />
              <span className="flex-1 min-w-0">
                <span
                  className={`block truncate text-sm text-text-2 ${
                    spineStrikesTitle(p.status) ? "line-through" : ""
                  }`}
                >
                  {p.name}
                </span>
                {p.killedAt && (
                  <Meta tone="faint" className="sm:hidden">
                    {new Date(p.killedAt).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Meta>
                )}
              </span>
              <Meta
                variant="dato"
                tone="faint"
                className="hidden sm:block w-20 text-right"
              >
                {t("livedDays", { count: lifespanDays(p) })}
              </Meta>
              <Meta variant="cintillo" tone="muted" className="w-40 truncate">
                {t(`cause.${cause}`)}
              </Meta>
              <button
                type="button"
                onClick={(e) => {
                  // El <summary> abre el detalle; revivir no debe hacerlo.
                  e.preventDefault();
                  e.stopPropagation();
                  onRevive(p);
                }}
                className="shrink-0 w-[88px] px-2 py-1 text-xs rounded-md border border-border text-text-3 hover:text-text hover:border-accent-a50 transition-colors duration-150 ease-out inline-flex items-center justify-center gap-1"
              >
                <HeartPulse size={11} /> {t("revive")}
              </button>
            </summary>
            <div className="px-3 pb-4 pt-1">
              <ProjectClosureNotes project={p} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
