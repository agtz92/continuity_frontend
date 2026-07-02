"use client";

/**
 * TodayFocusSection — "foco del día" de la vista Hoy: tareas vencidas/de hoy y
 * próximos pasos. Extraído de TodayView (ver AUDITORIA_CODIGO.md); el JSX se
 * preserva tal cual. El estado de plegado vive aquí (UI local); los datos y
 * callbacks llegan como props y los traductores por hook.
 */

import { useState } from "react";
import { CalendarCheck, CalendarClock, ChevronRight, Clock, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project, Task } from "@/lib/types";
import { daysOverdue, daysSince, todayLocalISODate } from "@/lib/date";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { toast } from "@/lib/toast";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { TaskToggle } from "../tasks/TaskToggle";
import type { useTodayFocus } from "@/hooks/useTodayFocus";

type FocusModel = ReturnType<typeof useTodayFocus>;

interface TodayFocusSectionProps {
  todayFocus: FocusModel["todayFocus"];
  todayTaskCounts: FocusModel["todayTaskCounts"];
  todayEffortHours: number;
  projects: Project[];
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onJumpToProject: (p: Project) => void;
  onJumpToTasks: () => void;
}

export function TodayFocusSection({
  todayFocus,
  todayTaskCounts,
  todayEffortHours,
  projects,
  onToggleTask,
  onEditTask,
  onJumpToProject,
  onJumpToTasks,
}: TodayFocusSectionProps) {
  const [showTodayFocus, setShowTodayFocus] = useState(true);
  const tFocus = useTranslations("views.today.focus");
  const tRow = useTranslations("taskRow");
  const { saveTask } = useTaskMutations();
  // Quick action on overdue focus cards: rewrite the due date to today.
  const moveTaskToToday = async (task: Task) => {
    const ok = await saveTask({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      dueDate: todayLocalISODate(),
      done: task.done,
      effortHours: task.effortHours,
      dueTime: task.dueTime,
      durationMinutes: task.durationMinutes,
    });
    if (ok) toast.success(tRow("movedToast"), 2000);
  };
  return (
    <CollapsibleSection
      open={showTodayFocus}
      onToggle={() => setShowTodayFocus((s) => !s)}
      icon={<Target size={18} className="text-accent" />}
      title={tFocus("title")}
      rightSlot={
        todayTaskCounts.total > 0 ? (
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-700 dark:text-orange-200 shadow-sm shadow-orange-500/10"
              title={tFocus("tasksTooltip", {
                dueToday: todayTaskCounts.dueToday,
                overdue: todayTaskCounts.overdue,
              })}
            >
              <Target size={11} className="text-orange-700 dark:text-orange-300" />
              <span>{tFocus("tasksLabel", { count: todayTaskCounts.total })}</span>
              {todayTaskCounts.overdue > 0 && (
                <span className="text-red-700 dark:text-red-300 font-semibold">
                  {tFocus("overdueExtra", { count: todayTaskCounts.overdue })}
                </span>
              )}
            </span>
            {todayEffortHours > 0 && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-accent-2/15 text-accent-2 border-accent-2/40"
                title={tFocus("totalHoursTooltip")}
              >
                <Clock size={11} className="text-accent-2" />
                {tFocus("totalHoursLabel", { hours: todayEffortHours })}
              </span>
            )}
          </span>
        ) : null
      }
    >
      <>
        {todayFocus.items.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-muted mb-3">{tFocus("emptyTitle")}</p>
            <p className="text-sm text-text-muted">
              {projects.length === 0
                ? tFocus("emptyHintFirst")
                : tFocus("emptyHintNext")}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {todayFocus.items.map((item, idx) => (
              <div
                key={idx}
                className={`bg-surface p-4 rounded-xl border border-l-[3px] transition-all hover:border-border ${
                  item.type === "overdue"
                    ? "border-red-500/30 border-l-red-500"
                    : item.type === "today"
                    ? "border-orange-500/30 border-l-amber-500"
                    : item.type === "stalled"
                    ? "border-amber-500/30 border-l-amber-500"
                    : "border-border border-l-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.task && (
                    <TaskToggle
                      done={false}
                      overdue={item.type === "overdue"}
                      onToggle={() => onToggleTask(item.task!)}
                      label={tFocus("markDone")}
                    />
                  )}
                  <div
                    className={`flex-1 min-w-0 ${item.task ? "cursor-pointer" : ""}`}
                    onClick={item.task ? () => onEditTask(item.task!) : undefined}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs uppercase tracking-wider font-medium ${
                          item.type === "overdue"
                            ? "text-red-400"
                            : item.type === "today"
                            ? "text-orange-400"
                            : item.type === "stalled"
                            ? "text-amber-400"
                            : "text-accent"
                        }`}
                      >
                        {tFocus(
                          item.type === "today"
                            ? "labels.dueToday"
                            : item.type === "overdue"
                            ? "labels.overdue"
                            : item.type === "stalled"
                            ? "labels.stalled"
                            : "labels.nextStep"
                        )}
                      </span>
                      {item.type === "overdue" &&
                        item.task?.dueDate &&
                        // IIFE para calcular los días de atraso una sola vez y omitir el
                        // badge si daysOverdue devuelve null (fecha no parseable / no vencida).
                        (() => {
                          const n = daysOverdue(item.task.dueDate);
                          return n !== null ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/25 text-red-700 dark:text-red-200 border border-red-500/50">
                              {tFocus("daysLate", { count: n })}
                            </span>
                          ) : null;
                        })()}
                      {item.project && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToProject(item.project!);
                          }}
                          className="text-xs text-text-muted hover:text-accent hover:underline"
                        >
                          · {item.project.name}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-text">
                        {item.task
                          ? item.task.title
                          : item.type === "stalled" && item.project
                          ? tFocus("daysIdleLine", {
                              name: item.project.name,
                              count: daysSince(item.project.lastActivity) ?? 0,
                            })
                          : item.project?.nextStep}
                      </span>
                      {item.task?.effortHours != null && (
                        <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
                          <Clock size={10} />
                          {item.task.effortHours}h
                        </span>
                      )}
                    </div>
                    {item.type === "overdue" && item.task && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveTaskToToday(item.task!);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-accent hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] transition-colors"
                        >
                          <CalendarCheck size={12} />
                          {tRow("moveToToday")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(item.task!);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-border text-text-muted hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] transition-colors"
                        >
                          <CalendarClock size={12} />
                          {tRow("reschedule")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {todayFocus.total > todayFocus.items.length && (
          <button
            onClick={onJumpToTasks}
            className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-200 text-sm font-medium transition-colors"
          >
            {tFocus("viewAll")}
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/30 text-orange-800 dark:text-orange-100">
              {tFocus("moreCount", {
                count: todayFocus.total - todayFocus.items.length,
              })}
            </span>
            <ChevronRight size={14} />
          </button>
        )}
      </>
    </CollapsibleSection>
  );
}
