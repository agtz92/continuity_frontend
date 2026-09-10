"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { Activity, Category, Project, Task } from "@/lib/types";
import { projectCooling, projectDays } from "@/lib/cooling";
import { causeOfDeath, type CauseOfDeath } from "@/lib/graveyard";
import { Meta } from "@/components/ui/Meta";

/**
 * La cabecera editorial de Analítica (S08, DP-08).
 *
 * El criterio del diseño es duro: *"ninguna métrica que no cambie una
 * decisión"*. Lo que hay aquí arriba son las cifras que sí la cambian; los doce
 * paneles con gráficas siguen existiendo debajo, tras "ver el detalle" — DP-08
 * decidió **no borrar nada** hasta poder medir si alguien baja.
 *
 * Todo se deriva de lo que el dashboard ya trae: cero peticiones nuevas, cero
 * resolvers nuevos. Si una cifra no se puede calcular con datos reales, no
 * está — ver abajo.
 */

/** Un update escrito en los últimos N días cuenta como "reciente". */
const RECENT_DAYS = 14;

export function AnalyticsHeadline({
  projects,
  tasks,
  activities,
  categories,
}: {
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  categories: Category[];
}) {
  const t = useTranslations("analytics.headline");
  const tCause = useTranslations("views.graveyard.cause");

  const live = useMemo(
    () => projects.filter((p) => p.status === "active"),
    [projects]
  );

  /** Días medios sin tocar, solo sobre lo vivo: promediar lo muerto no dice nada. */
  const avgUntouched = useMemo(() => {
    if (live.length === 0) return 0;
    return Math.round(
      live.reduce((sum, p) => sum + projectDays(p), 0) / live.length
    );
  }, [live]);

  const blockedTasks = useMemo(
    () => tasks.filter((x) => !x.done && (x.blockers?.length ?? 0) > 0).length,
    [tasks]
  );

  /** Porcentaje de proyectos vivos con un update ESCRITO reciente. */
  const withRecentUpdate = useMemo(() => {
    if (live.length === 0) return 0;
    const cut = Date.now() - RECENT_DAYS * 86_400_000;
    const fresh = new Set(
      activities
        .filter((a) => a.kind === "note" && new Date(a.created).getTime() >= cut)
        .map((a) => a.projectId)
        .filter(Boolean) as string[]
    );
    return Math.round(
      (live.filter((p) => fresh.has(p.id)).length / live.length) * 100
    );
  }, [live, activities]);

  /** Enfriamiento por categoría: cuántos vivos de cada una están fuera del tramo templado. */
  const cooling = useMemo(() => {
    const rows = categories.map((c) => {
      const own = live.filter((p) => p.categoryId === c.id);
      const cold = own.filter((p) => projectCooling(p) !== "warm").length;
      return { id: c.id, name: c.name, total: own.length, cold };
    });
    const loose = live.filter((p) => !p.categoryId);
    if (loose.length > 0) {
      rows.push({
        id: "__loose",
        name: t("noCategory"),
        total: loose.length,
        cold: loose.filter((p) => projectCooling(p) !== "warm").length,
      });
    }
    return rows
      .filter((r) => r.total > 0)
      .sort((a, b) => b.cold / b.total - a.cold / a.total)
      .slice(0, 4);
  }, [categories, live, t]);

  /** Dónde mueren los proyectos. `died_of` se deriva en `lib/graveyard.ts`. */
  const deaths = useMemo(() => {
    const killed = projects.filter((p) => p.status === "killed");
    if (killed.length === 0) return [];
    const tally = new Map<CauseOfDeath, number>();
    for (const p of killed) {
      const c = causeOfDeath(p, tasks);
      tally.set(c, (tally.get(c) ?? 0) + 1);
    }
    return [...tally.entries()]
      .map(([cause, count]) => ({ cause, count, total: killed.length }))
      .sort((a, b) => b.count - a.count);
  }, [projects, tasks]);

  const figures = [
    { key: "untouched", value: t("days", { count: avgUntouched }) },
    { key: "blocked", value: String(blockedTasks) },
    { key: "updated", value: `${withRecentUpdate}%` },
  ];

  return (
    <section className="space-y-6">
      {/* Las cifras. Todas tinta; el bloqueo se enciende solo si hay alguno. */}
      <div className="flex flex-wrap gap-x-10 gap-y-4 border-y border-line-08 py-4">
        {figures.map((f) => (
          <div key={f.key}>
            <Meta variant="cintillo" tone="faint" className="block">
              {t(`figure.${f.key}`)}
            </Meta>
            <div
              className={`font-display-app text-3xl leading-none mt-1 ${
                f.key === "blocked" && blockedTasks > 0
                  ? "text-signal"
                  : "text-text"
              }`}
            >
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {cooling.length > 0 && (
        <div>
          <Meta variant="cintillo" tone="muted" className="block mb-2">
            {t("coolingByCategory")}
          </Meta>
          <div className="space-y-1.5 max-w-lg">
            {cooling.map((row) => (
              <div key={row.id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-text-2">
                  {row.name}
                </span>
                <span className="flex-1 h-[6px] bg-line-08 overflow-hidden">
                  <span
                    className="block h-full bg-accent"
                    style={{ width: `${(row.cold / row.total) * 100}%` }}
                  />
                </span>
                <Meta variant="dato" tone="faint" className="shrink-0 w-16 text-right">
                  {row.cold}/{row.total}
                </Meta>
              </div>
            ))}
          </div>
        </div>
      )}

      {deaths.length > 0 && (
        <div>
          <Meta variant="cintillo" tone="muted" className="block mb-2">
            {t("whereTheyDie")}
          </Meta>
          <ul className="space-y-1 max-w-lg">
            {deaths.map((d) => (
              <li key={d.cause} className="flex items-baseline gap-3">
                <span className="flex-1 text-sm text-text-2">
                  {tCause(d.cause)}
                </span>
                <Meta variant="dato" tone="faint">
                  {d.count}/{d.total}
                </Meta>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
