"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, CalendarClock, CalendarPlus, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Project, Task } from "@/lib/types";
import { daysOverdue, daysSince, isDueToday, isOverdue } from "@/lib/date";
import { toast } from "@/lib/toast";
import { BlockerBadge } from "@/components/ui/BlockerBadge";
import { BlockedTaskDialog } from "./BlockedTaskDialog";
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
/** Trama diagonal de "detenido". Es la misma que usa `<BlockerBadge>`, un poco
 *  más suave porque aquí cubre toda la fila y hay texto encima. */
const BLOCKED_HATCH = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--signal-a04) 0 6px, transparent 6px 14px)",
} as const;

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
  // `blockedReason` y `blockedSince` los deriva el servidor (B1); el cálculo
  // local es el fallback para formas cacheadas de antes del rediseño.
  const blockReason = isBlocked
    ? task.blockedReason ||
      task.blockers.find((b) => b.externalDescription)?.externalDescription
    : undefined;
  const blockedDays = isBlocked
    ? (daysSince(
        task.blockedSince ??
          task.blockers.map((b) => b.created).sort()[0]
      ) ?? 0)
    : 0;

  const [askBlocked, setAskBlocked] = useState(false);

  const handleToggle = () => {
    // Cerrar algo que sigue bloqueado no es una acción, es una pregunta:
    // ¿se levantó el bloqueo, o la tarea dejó de importar? Ver
    // `BlockedTaskDialog`. Desmarcar una tarea ya hecha no pregunta nada.
    if (!done && isBlocked) {
      setAskBlocked(true);
      return;
    }
    if (!done) {
      setOptimisticDone(true);
      toast.success(t("completedToast"), 2500);
    } else {
      setOptimisticDone(false);
    }
    onToggle(task);
  };

  return (
    <>
      {askBlocked && (
        <BlockedTaskDialog
          task={task}
          onClose={() => setAskBlocked(false)}
          onResolve={() => {
            setOptimisticDone(true);
            toast.success(t("completedToast"), 2500);
            onToggle(task);
          }}
        />
      )}
    <motion.div
      layout
      initial={false}
      animate={{ opacity: optimisticDone ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      // La trama recorre la fila entera, no solo el chip: una tarea detenida
      // tiene que leerse detenida de un vistazo, y en escala de grises (§12.2).
      // Nada de bajar la opacidad del bloque — el diseño lo prohíbe (§12.7):
      // apagar el texto lo hace ilegible en vez de decir "esto no avanza".
      style={isBlocked ? BLOCKED_HATCH : undefined}
      className={`bg-surface border border-l-[3px] rounded-lg p-3 flex items-start gap-3 group ${
        isBlocked
          ? "border-signal-a50 border-l-signal"
          : overdue
          ? "border-signal-a50 border-l-signal"
          : dueToday
          ? "border-accent-a35 border-l-accent"
          : "border-border border-l-border"
      }`}
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
            <span className="text-xs px-2 py-0.5 rounded border bg-line-08 text-text-3 border-line-14 inline-flex items-center gap-1">
              <Clock size={10} />
              {task.effortHours}h
            </span>
          )}
        </div>
        <div className="text-xs text-text-muted flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          {overdue && lateDays !== null && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-signal-a12 text-signal border border-signal-a50">
              {t("overdueDays", { count: lateDays })}
            </span>
          )}
          {dueToday && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent-a12 text-accent border border-accent-a35">
              {t("todayBadge")}
            </span>
          )}
          {isBlocked && (
            // Trama + ✕ + días: un blocker tiene que distinguirse en una
            // captura en escala de grises, no solo por el color (§12.2).
            // La razón va al lado porque es el dato que desatasca.
            <span
              className="inline-flex items-center gap-1.5 max-w-[280px]"
              title={blockReason ?? t("blocked")}
            >
              <BlockerBadge compact since={blockedDays} />
              {blockReason && (
                <span className="truncate text-xs text-text-3">{blockReason}</span>
          )}
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
              className="inline-flex items-center gap-1 text-accent hover:text-accent hover:underline"
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
    </>
  );
}
