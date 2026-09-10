"use client";

import { useLocale, useTranslations } from "next-intl";

import type { Activity, Project } from "@/lib/types";
import { Meta } from "../ui/Meta";
import {
  describeActivity,
  formatActivityDate,
  iconFor,
} from "../log/entry";

/** Cuántos movimientos caben al pie sin convertir el Home en un feed. */
const TAIL = 8;

/**
 * La cola del log al pie del Home: lo último que pasó, en el mismo lenguaje
 * que el diario completo (S15) — lo que **tú** escribiste pesa como párrafo,
 * lo que hizo el sistema es una línea en versalitas.
 *
 * Es una **cola**, no el log: ocho entradas y un enlace al diario. El Home
 * responde "qué retomo hoy"; leer la historia entera es otra intención y tiene
 * su propia pestaña.
 */
export function HomeLogTail({
  activities,
  projects,
  onOpenLog,
}: {
  activities: Activity[];
  projects: Project[];
  onOpenLog: () => void;
}) {
  const t = useTranslations("views.today.logTail");
  const tEntry = useTranslations("views.log.entries");
  const tStatus = useTranslations("status");
  const locale = useLocale();

  const recent = [...activities]
    .sort((a, b) => b.created.localeCompare(a.created))
    .slice(0, TAIL);

  if (recent.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <Meta variant="cintillo" tone="muted">
          {t("title")}
        </Meta>
        <button
          type="button"
          onClick={onOpenLog}
          className="text-xs text-text-3 hover:text-accent transition-colors duration-150 ease-out"
        >
          {t("openLog")}
        </button>
      </div>

      <div className="divide-y divide-line-08 border-y border-line-08">
        {recent.map((a) => {
          const proj = projects.find((p) => p.id === a.projectId);
          const body = describeActivity({ activity: a, locale, tEntry, tStatus });

          if (a.kind !== "note") {
            return (
              <div key={a.id} className="flex items-baseline gap-3 py-2">
                <Meta tone="faint" className="shrink-0 w-16 tabular-nums">
                  {formatActivityDate(a.created, locale)}
                </Meta>
                <span className="shrink-0">{iconFor(a.kind)}</span>
                <Meta variant="cintillo" tone="muted">
                  {body}
                </Meta>
              </div>
            );
          }

          return (
            <div key={a.id} className="flex gap-3 py-3">
              <Meta tone="faint" className="shrink-0 w-16 tabular-nums pt-1">
                {formatActivityDate(a.created, locale)}
              </Meta>
              <div className="flex-1 min-w-0">
                <Meta variant="cintillo" tone="muted" className="block mb-1">
                  {t("writtenUpdate")}
                  {proj ? ` · ${proj.name}` : ""}
                </Meta>
                <p className="text-[15px] leading-[1.6] text-text-2 break-words max-w-[68ch]">
                  {body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
