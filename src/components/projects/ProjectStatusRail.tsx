"use client";

import { useTranslations } from "next-intl";

import type { Project, Task } from "@/lib/types";
import { daysSince } from "@/lib/date";
import { projectCooling, projectDays } from "@/lib/cooling";
import { Meta } from "../ui/Meta";
import { ProgressTicks } from "../ui/ProgressTicks";

/**
 * La columna de estado del proyecto: progreso, días sin tocar, días de vida.
 *
 * Son las tres cifras que el diseño pone al lado, y ninguna es un porcentaje
 * inventado — el progreso se cuenta en bloques (una marca por tarea, contables)
 * y los días salen de fechas reales. **Los días sin tocar se apagan o se
 * encienden según el tramo de enfriamiento**: frío se lee con tinta plena,
 * templado casi no se ve. Un proyecto que se apaga no merece una alarma, merece
 * que el número pese.
 */
export function ProjectStatusRail({
  project: p,
  tasks,
}: {
  project: Project;
  /** Solo las tareas de este proyecto. */
  tasks: Task[];
}) {
  const t = useTranslations("views.projects.rail");

  const done = tasks.filter((task) => task.done).length;
  const blocked = tasks.filter(
    (task) => !task.done && (task.blockers?.length ?? 0) > 0
  ).length;
  const days = projectDays(p);
  const age = daysSince(p.created) ?? 0;
  const cooling = projectCooling(p);

  return (
    <aside className="space-y-4">
      {tasks.length > 0 && (
        <div>
          <Meta variant="cintillo" tone="faint" className="block mb-1.5">
            {t("progress")}
          </Meta>
          <ProgressTicks done={done} total={tasks.length} blocked={blocked} />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3">
        <div>
          <Meta variant="cintillo" tone="faint" className="block">
            {t("untouched")}
          </Meta>
          <dd
            className={`font-display-app text-2xl leading-none mt-1 ${
              cooling === "cold"
                ? "text-text"
                : cooling === "cool"
                  ? "text-text-3"
                  : "text-text-5"
            }`}
          >
            {t("days", { count: days })}
          </dd>
        </div>
        <div>
          <Meta variant="cintillo" tone="faint" className="block">
            {t("age")}
          </Meta>
          <dd className="font-display-app text-2xl leading-none mt-1 text-text-3">
            {t("days", { count: age })}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
