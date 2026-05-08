"use client";

import { Rocket } from "lucide-react";
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
  onClick,
}: {
  project: Project;
  projectTasks: Task[];
  variant: "active" | "launched";
  categoryById: Record<string, Category>;
  onClick: () => void;
}) {
  const done = projectTasks.filter((t) => t.done).length;
  const todayCount = projectTasks.filter(
    (t) => !t.done && isDueToday(t.dueDate)
  ).length;
  const overdueCount = projectTasks.filter(
    (t) => !t.done && isOverdue(t.dueDate)
  ).length;
  const openCount = projectTasks.filter((t) => !t.done).length;
  const days = daysSince(p.lastActivity) ?? 0;

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
          <span title={priorityMeta(p.priority).label}>
            {priorityMeta(p.priority).emoji}
          </span>
        )}
        <span className="font-semibold truncate flex-1">{p.name}</span>
        {variant === "launched" && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
            {openCount} open
          </span>
        )}
        {overdueCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 shrink-0">
            {overdueCount} overdue
          </span>
        )}
        {todayCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 shrink-0">
            {todayCount} today
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
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {done}/{projectTasks.length} tasks
        </span>
        {variant === "active" && (
          <span className={days > 6 ? "text-amber-400" : ""}>{days}d ago</span>
        )}
      </div>
    </button>
  );
}
