"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, CalendarClock, CalendarPlus, Clock, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Project, Task } from "@/lib/types";
import { daysOverdue, isDueToday, isOverdue } from "@/lib/date";
import { toast } from "@/lib/toast";
import { TaskToggle } from "./TaskToggle";

/**
 * Bordered task row used inside the TasksView buckets. Row anatomy (designer
 * pass): circular TaskToggle · 3px urgency spine on the left edge · solid
 * OVERDUE/TODAY badge that explains the drift ("Vencida · 3 días") · inline
 * quick actions on overdue rows ("Mover a hoy" / "Reprogramar") so the next
 * decision is one click away instead of buried in the edit modal.
 *
 * Marking done confirms instantly (optimistic check + "✓ completed" toast) and
 * the row fades out as the refetch drops it — instead of freezing then popping.
 */
export function TaskRow({
  task,
  project,
  onToggle,
  onSchedule,
  onEdit,
  onMoveToday,
}: {
  task: Task;
  project: Project | undefined;
  onToggle: (t: Task) => void | Promise<void>;
  // Delete moved into the edit modal (TaskModal); tapping the row opens it. The
  // prop is kept optional so existing call sites don't break.
  onDelete?: (id: string) => void | Promise<void>;
  onSchedule?: (t: Task) => void;
  onEdit?: (t: Task) => void;
  /** One-click "due date → today" for overdue rows. */
  onMoveToday?: (t: Task) => void | Promise<void>;
}) {
  const t = useTranslations("taskRow");
  const locale = useLocale();
  const [optimisticDone, setOptimisticDone] = useState(false);
  const done = task.done || optimisticDone;
  const overdue = !done && isOverdue(task.dueDate);
  const dueToday = !done && isDueToday(task.dueDate);
  const isBlocked = !done && task.blockers.length > 0;
  const lateDays = overdue ? daysOverdue(task.dueDate) : null;
  const blockReason = isBlocked
    ? task.blockers.find((b) => b.externalDescription)?.externalDescription
    : undefined;

  const handleToggle = () => {
    if (!done) {
      setOptimisticDone(true);
      toast.success(t("completedToast"), 2500);
    } else {
      setOptimisticDone(false);
    }
    onToggle(task);
  };

  return (
    <motion.div
      layout
      initial={false}
      animate={{ opacity: optimisticDone ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      className={`bg-surface border border-l-[3px] rounded-lg p-3 flex items-start gap-3 group ${
        overdue
          ? "border-red-500/30 border-l-red-500"
          : dueToday
          ? "border-orange-500/30 border-l-amber-500"
          : "border-border border-l-border"
      } ${isBlocked ? "opacity-60" : ""}`}
    >
      <div className="mt-0.5">
        <TaskToggle
          done={done}
          overdue={overdue}
          blocked={isBlocked}
          onToggle={handleToggle}
          label={done ? t("markNotDone") : t("markDone")}
        />
      </div>
      <div
        className={`flex-1 min-w-0 ${onEdit ? "cursor-pointer" : ""}`}
        onClick={onEdit ? () => onEdit(task) : undefined}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={done ? "line-through text-text-muted" : "text-text"}>
            {task.title}
          </span>
          {task.effortHours != null && (
            <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
              <Clock size={10} />
              {task.effortHours}h
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          {overdue && lateDays !== null && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40">
              {t("overdueDays", { count: lateDays })}
            </span>
          )}
          {dueToday && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
              {t("todayBadge")}
            </span>
          )}
          {isBlocked && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 border border-gray-500/30 inline-flex items-center gap-1 max-w-[240px]"
              title={blockReason}
            >
              <Lock size={10} className="shrink-0" />
              <span className="truncate normal-case">
                {t("blocked")}
                {blockReason ? ` · ${blockReason}` : ""}
              </span>
            </span>
          )}
          {project && <span>{project.name}</span>}
          {task.dueDate ? (
            !overdue &&
            !dueToday && (
              <span>· {new Date(task.dueDate).toLocaleDateString(locale)}</span>
            )
          ) : onSchedule ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(task);
              }}
              className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:underline"
              title={t("addDate")}
            >
              <CalendarPlus size={12} /> {t("addDate")}
            </button>
          ) : null}
        </div>
        {overdue && (onMoveToday || onEdit) && (
          <div className="flex items-center gap-1.5 mt-2">
            {onMoveToday && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToday(task);
                }}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-accent hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition-colors"
              >
                <CalendarCheck size={12} />
                {t("moveToToday")}
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-border text-text-muted hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] transition-colors"
              >
                <CalendarClock size={12} />
                {t("reschedule")}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
