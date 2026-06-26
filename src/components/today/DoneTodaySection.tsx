"use client";

/**
 * DoneTodaySection — "completado hoy" de la vista Hoy: tareas, rutinas y logs
 * terminados, con filtro tareas/logs. Extraído de TodayView (ver
 * AUDITORIA_CODIGO.md); el JSX se preserva tal cual. El estado de plegado y de
 * filtro vive aquí (UI local); los datos/callbacks llegan como props.
 */

import { useState } from "react";
import { CheckCircle2, Clock, Edit2, Sparkles, TrendingUp, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project, Task } from "@/lib/types";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import type { useTodayFocus } from "@/hooks/useTodayFocus";
import type { useProductivityStats } from "@/hooks/useProductivityStats";

type FocusModel = ReturnType<typeof useTodayFocus>;
type Stats = ReturnType<typeof useProductivityStats>;

interface DoneTodaySectionProps {
  doneTodayItems: FocusModel["doneTodayItems"];
  doneTodayEffortHours: number;
  todayHoursByProject: Stats["todayHoursByProject"];
  projects: Project[];
  onJumpToProject: (p: Project) => void;
  onEditTask: (t: Task) => void;
  onToggleTask: (t: Task) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
}

export function DoneTodaySection({
  doneTodayItems,
  doneTodayEffortHours,
  todayHoursByProject,
  projects,
  onJumpToProject,
  onEditTask,
  onToggleTask,
  onUncompleteOccurrence,
}: DoneTodaySectionProps) {
  const [showDoneToday, setShowDoneToday] = useState(false);
  const [doneTodayFilter, setDoneTodayFilter] = useState<"all" | "task" | "log">("all");
  const tDone = useTranslations("views.today.doneToday");
  const tTabs = useTranslations("tabs");
    const taskCount = doneTodayItems.filter((i) => i.kind === "task").length;
    const logCount = doneTodayItems.filter((i) => i.kind === "log").length;
    const visibleItems =
      doneTodayFilter === "all"
        ? doneTodayItems
        : doneTodayItems.filter((i) => i.kind === doneTodayFilter);
    const toggleFilter = (kind: "task" | "log") =>
      setDoneTodayFilter((cur) => (cur === kind ? "all" : kind));
  return (
      <CollapsibleSection
        open={showDoneToday}
        onToggle={() => setShowDoneToday((s) => !s)}
        icon={<Sparkles size={18} className="text-accent" />}
        title={tDone("title")}
        rightSlot={
          <>
            {taskCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilter("task");
                }}
                aria-pressed={doneTodayFilter === "task"}
                title={
                  doneTodayFilter === "task"
                    ? tDone("showAll")
                    : tDone("showOnlyTasks")
                }
                className={`text-xs font-normal rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors ${
                  doneTodayFilter === "task"
                    ? "bg-accent/25 border border-accent/60 text-accent"
                    : doneTodayFilter === "log"
                    ? "bg-accent/5 border border-accent/15 text-accent/50 hover:text-accent"
                    : "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
                }`}
              >
                <CheckCircle2 size={11} />
                {tDone("tasksLabel", { count: taskCount })}
              </button>
            )}
            {logCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilter("log");
                }}
                aria-pressed={doneTodayFilter === "log"}
                title={
                  doneTodayFilter === "log"
                    ? tDone("showAll")
                    : tDone("showOnlyLogs")
                }
                className={`text-xs font-normal rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors ${
                  doneTodayFilter === "log"
                    ? "bg-accent-2/25 border border-accent-2/60 text-accent-2"
                    : doneTodayFilter === "task"
                    ? "bg-accent-2/5 border border-accent-2/15 text-accent-2/50 hover:text-accent-2"
                    : "bg-accent-2/10 border border-accent-2/30 text-accent-2 hover:bg-accent-2/20"
                }`}
              >
                <TrendingUp size={11} />
                {tDone("logsLabel", { count: logCount })}
              </button>
            )}
            {doneTodayEffortHours > 0 && (
              <span
                className="text-xs font-normal rounded-full px-2 py-0.5 inline-flex items-center gap-1 bg-accent-2/15 text-accent-2 border border-accent-2/40"
                title={tDone("hoursWorkedTooltip")}
              >
                <Clock size={11} />
                {tDone("hoursWorkedLabel", { hours: doneTodayEffortHours })}
              </span>
            )}
          </>
        }
      >
        <div className="bg-surface/40 border border-border rounded-xl p-3 sm:p-4 space-y-3">
          {todayHoursByProject.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/80">
              <span className="text-[10px] uppercase tracking-wider text-text-muted self-center mr-1">
                {tDone("hoursByProject")}
              </span>
              {todayHoursByProject.map(({ project, hours }) => (
                <button
                  key={project.id}
                  onClick={() => onJumpToProject(project)}
                  className="text-xs px-2 py-0.5 rounded border bg-accent/10 text-accent border-accent/30 hover:bg-accent/20 inline-flex items-center gap-1"
                >
                  <Clock size={10} />
                  {project.name} · {hours}h
                </button>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {visibleItems.map((item) => {
              if (item.kind === "task") {
                const taskItem = item.task;
                const proj = projects.find((p) => p.id === taskItem.projectId);
                return (
                  <div
                    key={`task-${taskItem.id}`}
                    className="flex items-start gap-2 group border-l-2 border-accent/40 pl-2.5"
                  >
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-accent">
                          {tDone("task")}
                        </span>
                        {proj && (
                          <button
                            onClick={() => onJumpToProject(proj)}
                            className="text-xs text-text-muted hover:text-accent hover:underline"
                          >
                            · {proj.name}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-text-muted line-through decoration-emerald-500/40 break-words">
                          {taskItem.title}
                        </span>
                        {taskItem.effortHours != null && (
                          <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
                            <Clock size={10} />
                            {taskItem.effortHours}h
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onEditTask(taskItem)}
                      className="text-text-muted hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      title={tDone("edit")}
                      aria-label={tDone("editTaskAria")}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onToggleTask(taskItem)}
                      className="text-text-muted hover:text-amber-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      title={tDone("undo")}
                      aria-label={tDone("undoAria")}
                    >
                      <Undo2 size={14} />
                    </button>
                  </div>
                );
              }
              if (item.kind === "routine") {
                return (
                  <div
                    key={`routine-${item.occurrenceId}`}
                    className="flex items-start gap-2 group border-l-2 border-accent/40 pl-2.5"
                  >
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-accent">
                          {tDone("routine")}
                        </span>
                        <span className="text-xs text-text-muted">
                          · {tTabs("routines")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-text-muted break-words">
                          {item.title}
                        </span>
                        {item.effortHours != null && (
                          <span className="text-xs px-2 py-0.5 rounded border bg-accent-2/15 text-accent-2 border-accent-2/30 inline-flex items-center gap-1">
                            <Clock size={10} />
                            {item.effortHours}h
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onUncompleteOccurrence(item.occurrenceId)}
                      className="text-text-muted hover:text-amber-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      title={tDone("undo")}
                      aria-label={tDone("undoAria")}
                    >
                      <Undo2 size={14} />
                    </button>
                  </div>
                );
              }
              const proj = projects.find((p) => p.id === item.projectId);
              const badgeKey = item.source === "projectNote" ? "note" : "log";
              return (
                <div
                  key={`log-${item.source}-${item.id}`}
                  className="flex items-start gap-2 border-l-2 border-accent-2/40 pl-2.5"
                >
                  <TrendingUp size={16} className="text-accent-2 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[10px] uppercase tracking-wider font-medium text-accent-2">
                        {tDone(badgeKey)}
                      </span>
                      {proj && (
                        <button
                          onClick={() => onJumpToProject(proj)}
                          className="text-xs text-text-muted hover:text-accent hover:underline"
                        >
                          · {proj.name}
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-text-muted break-words">
                      {item.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CollapsibleSection>
    );
}
