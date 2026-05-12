"use client";

import { useMemo } from "react";
import type { Activity, Project, ProjectNote, Task } from "@/lib/types";
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
  | {
      kind: "log";
      time: number;
      /** "activity" = a timeline note (Activity kind=NOTE).
       *  "projectNote" = a rich note from the project's Notes section. */
      source: "activity" | "projectNote";
      id: string;
      projectId: string | null;
      text: string;
    };

/** Aggregates all the "today" derived data so views can subscribe to it cleanly. */
export function useTodayFocus({
  projects,
  tasks,
  activities,
  projectNotes,
}: {
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  projectNotes: ProjectNote[];
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
    return items.sort((a, b) => b.time - a.time);
  }, [tasks, activities, projectNotes]);

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
