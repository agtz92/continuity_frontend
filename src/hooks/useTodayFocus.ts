"use client";

import { useMemo } from "react";
import type { Project, Task, UpdateEntry } from "@/lib/types";
import {
  daysSince,
  isCompletedToday,
  isDueToday,
  isOverdue,
} from "@/lib/date";

export type FocusItem = {
  type: "overdue" | "today" | "stalled" | "nextStep";
  task?: Task;
  project?: Project;
};

export type DoneItem =
  | { kind: "task"; time: number; task: Task }
  | { kind: "log"; time: number; update: UpdateEntry };

/** Aggregates all the "today" derived data so views can subscribe to it cleanly. */
export function useTodayFocus({
  projects,
  tasks,
  updates,
}: {
  projects: Project[];
  tasks: Task[];
  updates: UpdateEntry[];
}) {
  const stalled = useMemo(
    () =>
      projects.filter(
        (p) =>
          ["active", "idea"].includes(p.status) &&
          (daysSince(p.lastActivity) ?? 0) >= 7
      ),
    [projects]
  );

  const todayFocus = useMemo(() => {
    const focus: FocusItem[] = [];

    tasks
      .filter((t) => !t.done && isOverdue(t.dueDate))
      .forEach((t) =>
        focus.push({
          type: "overdue",
          task: t,
          project: projects.find((p) => p.id === t.projectId),
        })
      );

    tasks
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
  }, [projects, tasks, stalled]);

  const todayTaskCounts = useMemo(() => {
    const overdue = tasks.filter((t) => !t.done && isOverdue(t.dueDate)).length;
    const dueToday = tasks.filter((t) => !t.done && isDueToday(t.dueDate)).length;
    return { overdue, dueToday, total: overdue + dueToday };
  }, [tasks]);

  const todayEffortHours = useMemo(() => {
    const sum = tasks
      .filter(
        (t) =>
          !t.done &&
          (isOverdue(t.dueDate) || isDueToday(t.dueDate)) &&
          t.effortHours != null
      )
      .reduce((acc, t) => acc + (t.effortHours as number), 0);
    return Math.round(sum * 10) / 10;
  }, [tasks]);

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
    updates
      .filter((u) => isCompletedToday(u.date))
      .forEach((u) =>
        items.push({
          kind: "log",
          time: new Date(u.date).getTime(),
          update: u,
        })
      );
    return items.sort((a, b) => b.time - a.time);
  }, [tasks, updates]);

  const doneTodayEffortHours = useMemo(() => {
    const sum = tasks
      .filter(
        (t) => t.done && isCompletedToday(t.completedAt) && t.effortHours != null
      )
      .reduce((acc, t) => acc + (t.effortHours as number), 0);
    return Math.round(sum * 10) / 10;
  }, [tasks]);

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
