"use client";

import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Clock,
  Pencil,
  Repeat,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type { Routine } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import { describeRecurrence } from "@/lib/recurrence";
import { todayLocalISODate } from "@/lib/date";
import { toast } from "@/lib/toast";

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
  onDelete,
}: {
  routine: Routine;
  scheduledDate: string;
  occurrenceId: string | null;
  project?: { name: string; color: string } | null;
  onComplete: (routineId: string, scheduledDate: string) => void | Promise<void>;
  onUncomplete: (occurrenceId: string) => void | Promise<void>;
  onEdit?: (r: Routine) => void;
  onArchive?: (r: Routine) => void | Promise<void>;
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
      className={`bg-surface border rounded-lg p-3 flex items-center gap-3 group ${
        overdue
          ? "border-red-500/30"
          : dueToday
          ? "border-orange-500/30"
          : "border-border"
      }`}
    >
      <button
        onClick={handleToggle}
        className={isDone ? "text-accent" : "text-text-muted hover:text-text"}
        aria-label={isDone ? t("markNotDone") : t("markDone")}
        title={isDone ? t("markNotDone") : t("markDone")}
      >
        <CheckCircle2 size={18} />
      </button>
      <div
        className={`flex-1 min-w-0 ${onEdit ? "cursor-pointer" : ""}`}
        onClick={onEdit ? () => onEdit(routine) : undefined}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={isDone ? "line-through text-text-muted" : "text-text"}>
            {routine.title}
          </span>
          <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
            <Repeat size={10} />
            {describeRecurrence(routine, recLabel)}
          </span>
          {routine.effortHours != null && (
            <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
              <Clock size={10} />
              {routine.effortHours}h
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted flex flex-wrap items-center gap-x-2 mt-0.5">
          <span
            className={
              overdue
                ? "text-red-400"
                : dueToday
                ? "text-orange-400"
                : ""
            }
          >
            {dueToday
              ? t("today")
              : new Date(scheduledDate + "T00:00:00").toLocaleDateString(locale)}
          </span>
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
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(routine.id);
          }}
          className="text-text-muted hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
          aria-label={t("deleteAria")}
          title={t("deleteAria")}
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}
