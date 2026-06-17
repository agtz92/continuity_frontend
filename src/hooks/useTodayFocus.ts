"use client";

import { useMemo } from "react";
import type {
  Activity,
  Project,
  ProjectNote,
  Routine,
  RoutineOccurrence,
  Task,
} from "@/lib/types";
import {
  isCompletedToday,
  isDueToday,
  isOverdue,
} from "@/lib/date";
import { isDailyViewStatus } from "@/lib/projectStatus";

export type FocusItem = {
  type: "overdue" | "today" | "stalled" | "nextStep";
  task?: Task;
  project?: Project;
};

export type DoneItem =
  | { kind: "task"; time: number; task: Task }
  | {
      kind: "log";
      time: number;
      /** "activity" = a timeline note (Activity kind=NOTE).
       *  "projectNote" = a rich note from the project's Notes section. */
      source: "activity" | "projectNote";
      id: string;
      projectId: string | null;
      text: string;
    }
  | {
      kind: "routine";
      time: number;
      occurrenceId: string;
      routineId: string;
      title: string;
      effortHours: number | null;
    };

/** Aggregates all the "today" derived data so views can subscribe to it cleanly. */
export function useTodayFocus({
  projects,
  tasks,
  activities,
  projectNotes,
  routines,
  routineOccurrences,
}: {
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  projectNotes: ProjectNote[];
  routines: Routine[];
  routineOccurrences: RoutineOccurrence[];
}) {
  // Stalled is now a persisted status (auto-set by the backend cron at 14 days
  // idle), not a client-derived calculation.
  const stalled = useMemo(
    () => projects.filter((p) => p.status === "stalled"),
    [projects]
  );

  // Tasks shown in Today: standalone tasks (no project) are always visible;
  // project tasks only when the parent is in a daily-view status
  // (active/idea/launched). Excludes paused/stalled/killed/archived.
  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );
  const dailyTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (!t.projectId) return true;
        const parent = projectById.get(t.projectId);
        return parent ? isDailyViewStatus(parent.status) : true;
      }),
    [tasks, projectById]
  );

  const todayFocus = useMemo(() => {
    const focus: FocusItem[] = [];

    dailyTasks
      .filter((t) => !t.done && isOverdue(t.dueDate))
      .forEach((t) =>
        focus.push({
          type: "overdue",
          task: t,
          project: projects.find((p) => p.id === t.projectId),
        })
      );

    dailyTasks
      .filter((t) => !t.done && isDueToday(t.dueDate))
      .forEach((t) =>
        focus.push({
          type: "today",
          task: t,
          project: projects.find((p) => p.id === t.projectId),
        })
      );

    stalled
      .slice(0, 3)
      .forEach((p) => focus.push({ type: "stalled", project: p }));

    projects
      .filter((p) => p.status === "active")
      .forEach((p) => {
        const projectTasks = tasks.filter(
          (t) => t.projectId === p.id && !t.done
        );
        if (projectTasks.length === 0 && p.nextStep) {
          focus.push({ type: "nextStep", project: p });
        }
      });

    return { items: focus.slice(0, 6), total: focus.length };
  }, [projects, dailyTasks, stalled]);

  const todayTaskCounts = useMemo(() => {
    const overdue = dailyTasks.filter((t) => !t.done && isOverdue(t.dueDate)).length;
    const dueToday = dailyTasks.filter((t) => !t.done && isDueToday(t.dueDate)).length;
    return { overdue, dueToday, total: overdue + dueToday };
  }, [dailyTasks]);

  const todayEffortHours = useMemo(() => {
    const sum = dailyTasks
      .filter(
        (t) =>
          !t.done &&
          (isOverdue(t.dueDate) || isDueToday(t.dueDate)) &&
          t.effortHours != null
      )
      .reduce((acc, t) => acc + (t.effortHours as number), 0);
    return Math.round(sum * 10) / 10;
  }, [dailyTasks]);

  const doneTodayItems = useMemo(() => {
    const items: DoneItem[] = [];
    tasks
      .filter((t) => t.done && isCompletedToday(t.completedAt))
      .forEach((t) =>
        items.push({
          kind: "task",
          time: t.completedAt ? new Date(t.completedAt).getTime() : 0,
          task: t,
        })
      );
    // Surface user-authored notes here. Both flavors count:
    //   - Timeline notes (Activity kind=NOTE) from the "Log Update" button.
    //   - Rich project notes (ProjectNote) from the project's Notes section.
    // Achievements like task_completed are already covered by the
    // task-completed branch above. Other auto-events (creates, status
    // changes, etc.) belong in the LogView, not "done today".
    activities
      .filter((a) => a.kind === "note" && isCompletedToday(a.created))
      .forEach((a) =>
        items.push({
          kind: "log",
          source: "activity",
          time: new Date(a.created).getTime(),
          id: a.id,
          projectId: a.projectId,
          text: a.note,
        })
      );
    projectNotes
      .filter((n) => isCompletedToday(n.created))
      .forEach((n) => {
        const text =
          n.title?.trim() ||
          (n.body || "").split("\n")[0]?.trim() ||
          "(untitled note)";
        items.push({
          kind: "log",
          source: "projectNote",
          time: new Date(n.created).getTime(),
          id: n.id,
          projectId: n.projectId,
          text,
        });
      });
    const routineById = new Map(routines.map((r) => [r.id, r]));
    routineOccurrences
      .filter((occ) => isCompletedToday(occ.completedAt))
      .forEach((occ) => {
        const r = routineById.get(occ.routineId);
        if (!r) return;
        items.push({
          kind: "routine",
          time: new Date(occ.completedAt).getTime(),
          occurrenceId: occ.id,
          routineId: r.id,
          title: r.title,
          effortHours: r.effortHours,
        });
      });
    return items.sort((a, b) => b.time - a.time);
  }, [tasks, activities, projectNotes, routines, routineOccurrences]);

  const doneTodayEffortHours = useMemo(() => {
    const taskSum = tasks
      .filter(
        (t) => t.done && isCompletedToday(t.completedAt) && t.effortHours != null
      )
      .reduce((acc, t) => acc + (t.effortHours as number), 0);
    const routineById = new Map(routines.map((r) => [r.id, r]));
    const routineSum = routineOccurrences
      .filter((occ) => isCompletedToday(occ.completedAt))
      .reduce((acc, occ) => {
        const r = routineById.get(occ.routineId);
        return r?.effortHours != null ? acc + r.effortHours : acc;
      }, 0);
    return Math.round((taskSum + routineSum) * 10) / 10;
  }, [tasks, routines, routineOccurrences]);

  const launchedWithOpenTasks = useMemo(
    () =>
      projects
        .filter((p) => p.status === "launched")
        .map((p) => {
          const projectTasks = tasks.filter((t) => t.projectId === p.id);
          const openCount = projectTasks.filter((t) => !t.done).length;
          return { project: p, projectTasks, openCount };
        })
        .filter((x) => x.openCount > 0),
    [projects, tasks]
  );

  return {
    stalled,
    todayFocus,
    todayTaskCounts,
    todayEffortHours,
    doneTodayItems,
    doneTodayEffortHours,
    launchedWithOpenTasks,
  };
}
