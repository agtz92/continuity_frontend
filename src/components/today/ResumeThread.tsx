"use client";

import { useLocale, useTranslations } from "next-intl";

import type { Category, Project, Task } from "@/lib/types";
import type { ResumeThread as ResumeThreadData } from "@/lib/homeSignals";
import { projectBlockedDays, projectIsBlocked } from "@/lib/cooling";
import { Spine } from "../ui/Spine";
import { Meta } from "../ui/Meta";
import { CategoryTag } from "../ui/CategoryTag";
import { BlockerBadge } from "../ui/BlockerBadge";

/**
 * "Dónde te quedaste" — el bloque protagonista del Home.
 *
 * El criterio del rediseño para esta pantalla es responder *qué retomo* en
 * cinco segundos. Por eso aquí hay **un** proyecto, no una lista: el último que
 * se tocó, con lo único que hace falta para volver a entrar — lo último que
 * escribiste, cuál era el siguiente paso, y qué lo tiene parado si algo lo tiene.
 *
 * El update escrito se cita como **párrafo**, no como card ni como cintillo: es
 * prosa tuya y se lee, igual que en el diario (S15). Si nunca escribiste uno,
 * el hueco se dice en voz baja en vez de rellenarse con un evento del sistema.
 */
export function ResumeThread({
  thread,
  tasks,
  categoryById,
  onOpen,
  onLogUpdate,
}: {
  thread: ResumeThreadData;
  /** Todas las tareas; de aquí sale la razón del blocker. */
  tasks: Task[];
  categoryById: Record<string, Category>;
  onOpen: (p: Project) => void;
  onLogUpdate: (p: Project) => void;
}) {
  const t = useTranslations("views.today.resumeThread");
  const locale = useLocale();
  const { project: p, lastNote, days } = thread;

  const openTasks = tasks.filter((task) => task.projectId === p.id && !task.done);
  const blockedCount = openTasks.filter(
    (task) => (task.blockers?.length ?? 0) > 0
  ).length;
  const blocked = projectIsBlocked(p, blockedCount);
  const blockerReason = openTasks
    .flatMap((task) => task.blockers ?? [])
    .sort((a, b) => a.created.localeCompare(b.created))
    .find((b) => b.externalDescription)?.externalDescription;

  const category = p.categoryId ? categoryById[p.categoryId] : undefined;

  return (
    <section className="relative bg-surface border border-border rounded-lg pl-4 pr-4 py-4 overflow-hidden">
      <Spine status={p.status} priority={p.priority} blocked={blocked} />

      <Meta variant="cintillo" tone="faint" className="block">
        {t("eyebrow")}
      </Meta>

      <div className="mt-2 flex items-baseline gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => onOpen(p)}
          className="font-display-app text-xl leading-tight text-text hover:text-accent transition-colors duration-150 ease-out text-left"
        >
          {p.name}
        </button>
        <CategoryTag
          name={category?.name}
          color={category?.color}
          loose={!category}
        />
        <Meta tone="faint">{t("daysAgo", { count: days })}</Meta>
      </div>

      {/* La cita: 15px y interlineado de lectura. Es prosa, no metadato. */}
      {lastNote ? (
        <blockquote className="mt-3 border-l-[3px] border-line-14 pl-3">
          <p className="text-[15px] leading-[1.6] text-text-2 whitespace-pre-line">
            {lastNote.note}
          </p>
          <Meta tone="faint" className="mt-1 block">
            {new Date(lastNote.created).toLocaleDateString(locale, {
              month: "long",
              day: "numeric",
            })}
          </Meta>
        </blockquote>
      ) : (
        <Meta tone="faint" className="mt-3 block">
          {t("noUpdate")}
        </Meta>
      )}

      {blocked && (
        <BlockerBadge
          className="mt-3"
          since={projectBlockedDays(p)}
          reason={blockerReason}
          blocksCount={blockedCount || undefined}
        />
      )}

      {p.nextStep && (
        <p className="mt-3 text-sm text-text-2">
          <span className="text-text-4">→ </span>
          {p.nextStep}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onLogUpdate(p)}
          className="px-3 py-1.5 text-sm rounded-md bg-accent-a12 text-accent border border-accent-a35 hover:bg-accent-a22 transition-colors duration-150 ease-out"
        >
          {t("write")}
        </button>
        <button
          type="button"
          onClick={() => onOpen(p)}
          className="px-3 py-1.5 text-sm rounded-md border border-border text-text-3 hover:text-text transition-colors duration-150 ease-out"
        >
          {t("open")}
        </button>
      </div>
    </section>
  );
}
