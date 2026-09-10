"use client";

import {
  Archive,
  ArchiveRestore,
  Clock,
  Pencil,
  Repeat,
} from "lucide-react";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type { Routine } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import { describeRecurrence } from "@/lib/recurrence";
import { daysOverdue, todayLocalISODate } from "@/lib/date";
import { toast } from "@/lib/toast";
import type { OccurrenceMark } from "@/lib/routineHistory";
import { TaskToggle } from "../tasks/TaskToggle";
import { OccurrenceRule } from "./OccurrenceRule";

/**
 * Row for an individual routine occurrence. Used inside RoutinesView and
 * TodayView. `scheduledDate` is the specific date this row represents;
 * `occurrenceId` is non-null iff the user already completed that day.
 *
 * Completing confirms instantly (optimistic check + "✓ completed" toast) and the
 * row fades out as the refetch drops it — instead of freezing then popping.
 */
export function RoutineRow({
  routine,
  scheduledDate,
  occurrenceId,
  project,
  onComplete,
  onUncomplete,
  onEdit,
  onArchive,
  rule,
  streak = 0,
}: {
  routine: Routine;
  scheduledDate: string;
  occurrenceId: string | null;
  project?: { name: string; color: string } | null;
  /** Historia derivada de la rutina. Solo se pasa en la PRIMERA fila que la
   *  rutina ocupa dentro de un bucket: una rutina diaria genera siete filas y
   *  siete reglas idénticas serían ruido, no información. */
  rule?: OccurrenceMark[];
  streak?: number;
  onComplete: (routineId: string, scheduledDate: string) => void | Promise<void>;
  onUncomplete: (occurrenceId: string) => void | Promise<void>;
  onEdit?: (r: Routine) => void;
  onArchive?: (r: Routine) => void | Promise<void>;
  /** Aceptada y no usada: borrar vive en el modal de edición, no en la fila
   *  (ver CLAUDE.md). Se mantiene para no romper los call sites que la pasan. */
  onDelete?: (id: string) => void | Promise<void>;
}) {
  const t = useTranslations("routineRow");
  const tRec = useTranslations("recurrence");
  const locale = useLocale();
  const recLabel = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      tRec(key, vars),
    [tRec]
  );
  const [optimisticDone, setOptimisticDone] = useState(false);
  const isDone = occurrenceId !== null || optimisticDone;
  const today = todayLocalISODate();
  const overdue = !isDone && scheduledDate < today;
  const dueToday = !isDone && scheduledDate === today;
  const lateDays = overdue ? daysOverdue(scheduledDate) : null;

  const handleToggle = () => {
    if (isDone) {
      // Un-complete only once the server occurrence exists; ignore taps while
      // an optimistic completion is still in flight.
      if (occurrenceId) {
        setOptimisticDone(false);
        onUncomplete(occurrenceId);
      }
    } else {
      setOptimisticDone(true);
      toast.success(t("completedToast"), 2500);
      onComplete(routine.id, scheduledDate);
    }
  };

  return (
    <motion.div
      layout
      initial={false}
      animate={{ opacity: optimisticDone ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      className={`bg-surface border border-l-[3px] rounded-lg p-3 flex items-center gap-3 group ${
        overdue
          ? "border-signal-a50 border-l-signal"
          : dueToday
          ? "border-accent-a35 border-l-accent"
          : "border-border border-l-border"
      }`}
    >
      <TaskToggle
        done={isDone}
        overdue={overdue}
        kind="routine"
        onToggle={handleToggle}
        label={isDone ? t("markNotDone") : t("markDone")}
      />
      <div
        className={`flex-1 min-w-0 ${onEdit ? "cursor-pointer" : ""}`}
        onClick={onEdit ? () => onEdit(routine) : undefined}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={isDone ? "line-through text-text-muted" : "text-text"}>
            {routine.title}
          </span>
          <span className="text-xs px-2 py-0.5 rounded border bg-line-08 text-text-3 border-line-14 inline-flex items-center gap-1">
            <Repeat size={10} />
            {describeRecurrence(routine, recLabel)}
          </span>
          {routine.effortHours != null && (
            <span className="text-xs px-2 py-0.5 rounded border bg-line-08 text-text-3 border-line-14 inline-flex items-center gap-1">
              <Clock size={10} />
              {routine.effortHours}h
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
          {overdue && lateDays !== null ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-signal-a12 text-signal border border-signal-a50">
              {t("overdueDays", { count: lateDays })}
            </span>
          ) : dueToday ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent-a12 text-accent border border-accent-a35">
              {t("todayBadge")}
            </span>
          ) : (
            <span>
              {new Date(scheduledDate + "T00:00:00").toLocaleDateString(locale)}
            </span>
          )}
          {project && (
            <span className="inline-flex items-center gap-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${categoryColorClass(project.color).dot}`}
              />
              {project.name}
            </span>
          )}
          {routine.description && <span>· {routine.description}</span>}
        </div>
        {rule && rule.length > 0 && (
          <OccurrenceRule marks={rule} streak={streak} className="mt-1.5" />
        )}
      </div>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(routine);
          }}
          className="text-text-muted hover:text-text sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
          aria-label={t("editAria")}
          title={t("editAria")}
        >
          <Pencil size={14} />
        </button>
      )}
      {onArchive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(routine);
          }}
          className="text-text-muted hover:text-text sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
          aria-label={routine.archived ? t("unarchiveAria") : t("archiveAria")}
          title={routine.archived ? t("unarchiveAria") : t("archiveAria")}
        >
          {routine.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>
      )}
    </motion.div>
  );
}
