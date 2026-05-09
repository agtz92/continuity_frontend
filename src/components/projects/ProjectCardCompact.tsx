"use client";

import { Clock, Rocket, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, Project, Task } from "@/lib/types";
import { categoryColorClass, priorityMeta } from "@/lib/types";
import { daysSince, isDueToday, isOverdue } from "@/lib/date";

/**
 * Compact card used in Today's "Active Projects" and "Launched · still has tasks" grids.
 * Variants share layout but differ in: background tint, header lead (priority emoji vs Rocket),
 * footer ("Xd ago" only for active), and an extra "X open" badge for launched.
 */
export function ProjectCardCompact({
  project: p,
  projectTasks,
  variant,
  categoryById,
  totalEffortHours,
  todayEffortHours,
  comebackGapDays,
  onClick,
}: {
  project: Project;
  projectTasks: Task[];
  variant: "active" | "launched";
  categoryById: Record<string, Category>;
  totalEffortHours?: number;
  todayEffortHours?: number;
  comebackGapDays?: number | null;
  onClick: () => void;
}) {
  const t = useTranslations("projectCard");
  const tPriority = useTranslations("priority");
  const done = projectTasks.filter((t) => t.done).length;
  const total = projectTasks.length;
  const todayCount = projectTasks.filter(
    (t) => !t.done && isDueToday(t.dueDate)
  ).length;
  const overdueCount = projectTasks.filter(
    (t) => !t.done && isOverdue(t.dueDate)
  ).length;
  const openCount = projectTasks.filter((t) => !t.done).length;
  const days = daysSince(p.lastActivity) ?? 0;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);

  const baseBg =
    variant === "launched"
      ? "bg-blue-500/5 hover:border-blue-500/40"
      : "bg-zinc-900 hover:border-zinc-700";
  const restBorder =
    variant === "launched" ? "border-blue-500/20" : "border-zinc-800";
  const border =
    overdueCount > 0
      ? "border-red-500/40"
      : todayCount > 0
      ? "border-orange-500/40"
      : restBorder;

  return (
    <button
      onClick={onClick}
      className={`text-left ${baseBg} border rounded-xl p-4 transition-all ${border}`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {variant === "launched" ? (
          <Rocket size={14} className="text-blue-400 shrink-0" />
        ) : (
          <span title={tPriority(p.priority)}>
            {priorityMeta(p.priority).emoji}
          </span>
        )}
        <span className="font-semibold truncate flex-1">{p.name}</span>
        {comebackGapDays != null && comebackGapDays > 0 && (
          <span
            className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 inline-flex items-center gap-1"
            title={t("comebackTooltip")}
          >
            <Sparkles size={10} />
            {t("comebackBadge", { days: comebackGapDays })}
          </span>
        )}
        {variant === "launched" && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
            {t("openCount", { count: openCount })}
          </span>
        )}
        {overdueCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 shrink-0">
            {t("overdueBadge", { count: overdueCount })}
          </span>
        )}
        {todayCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 shrink-0">
            {t("todayBadge", { count: todayCount })}
          </span>
        )}
      </div>
      {p.categoryId && categoryById[p.categoryId] && (
        <span
          className={`inline-block text-xs px-2 py-0.5 rounded border mb-2 ${
            categoryColorClass(categoryById[p.categoryId].color).chip
          }`}
        >
          {categoryById[p.categoryId].name}
        </span>
      )}
      {p.nextStep && (
        <div className="text-sm text-zinc-400 mb-3 line-clamp-2">
          → {p.nextStep}
        </div>
      )}
      {total > 0 && (
        <div className="mb-2">
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full ${
                donePct >= 80
                  ? "bg-emerald-400"
                  : donePct >= 40
                  ? "bg-blue-400"
                  : "bg-zinc-500"
              }`}
              style={{ width: `${donePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
            <span>{t("donePct", { pct: donePct })}</span>
            <span>
              {done}/{total}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-zinc-500 gap-2 flex-wrap">
        <div className="inline-flex items-center gap-2 flex-wrap">
          {todayEffortHours != null && todayEffortHours > 0 && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              title={t("todayHoursTooltip")}
            >
              <Clock size={10} />
              {t("todayHoursLabel", { hours: todayEffortHours })}
            </span>
          )}
          {totalEffortHours != null && totalEffortHours > 0 && (
            <span
              className="inline-flex items-center gap-1 text-zinc-500"
              title={t("totalHoursTooltip")}
            >
              <Clock size={10} />
              {t("totalHoursLabel", { hours: totalEffortHours })}
            </span>
          )}
        </div>
        {variant === "active" && (
          <span className={days > 6 ? "text-amber-400" : ""}>
            {t("daysAgo", { days })}
          </span>
        )}
      </div>
    </button>
  );
}
