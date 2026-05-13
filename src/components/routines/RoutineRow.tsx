"use client";

import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Pencil,
  Repeat,
  X,
} from "lucide-react";
import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Routine } from "@/lib/types";
import { describeRecurrence } from "@/lib/recurrence";
import { todayLocalISODate } from "@/lib/date";

/**
 * Row for an individual routine occurrence. Used inside RoutinesView and
 * TodayView. `scheduledDate` is the specific date this row represents;
 * `occurrenceId` is non-null iff the user already completed that day.
 */
export function RoutineRow({
  routine,
  scheduledDate,
  occurrenceId,
  onComplete,
  onUncomplete,
  onEdit,
  onArchive,
  onDelete,
}: {
  routine: Routine;
  scheduledDate: string;
  occurrenceId: string | null;
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
  const done = occurrenceId !== null;
  const today = todayLocalISODate();
  const overdue = !done && scheduledDate < today;
  const dueToday = !done && scheduledDate === today;

  const handleToggle = () => {
    if (done && occurrenceId) {
      onUncomplete(occurrenceId);
    } else {
      onComplete(routine.id, scheduledDate);
    }
  };

  return (
    <div
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
        className={done ? "text-accent" : "text-text-muted hover:text-text"}
        aria-label={done ? t("markNotDone") : t("markDone")}
      >
        <CheckCircle2 size={18} />
      </button>
      <div
        className={`flex-1 min-w-0 ${onEdit ? "cursor-pointer" : ""}`}
        onClick={onEdit ? () => onEdit(routine) : undefined}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={done ? "line-through text-text-muted" : "text-text"}>
            {routine.title}
          </span>
          <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
            <Repeat size={10} />
            {describeRecurrence(routine, recLabel)}
          </span>
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
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
