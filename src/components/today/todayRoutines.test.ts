/**
 * Unit tests for the pure "today routines" logic extracted from TodayView
 * (see AUDITORIA_CODIGO.md). "Today" comes from todayLocalISODate(); overdue
 * cases use a fixed far-past date.
 */

import { describe, it, expect } from "vitest";
import type { Project, Routine, RoutineOccurrence } from "@/lib/types";
import { todayLocalISODate } from "@/lib/date";
import {
  computeTodayRoutineItems,
  routineCounts,
  routineEffortHours,
  type TodayRoutineItem,
} from "./todayRoutines";

const TODAY = todayLocalISODate();

function routine(o: Partial<Routine> = {}): Routine {
  return {
    id: "r1",
    title: "Routine",
    description: "",
    recurrenceType: "every_n",
    startDate: "2024-01-01",
    endDate: null,
    weekdays: [],
    intervalN: 1,
    intervalUnit: "days",
    monthlyDay: null,
    effortHours: null,
    archived: false,
    created: "2024-01-01",
    projectId: null,
    timeOfDay: null,
    durationMinutes: null,
    ...o,
  };
}

function project(o: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "P",
    description: "",
    why: "",
    nextStep: "",
    status: "active",
    priority: "medium",
    categoryId: null,
    lastActivity: TODAY,
    created: TODAY,
    dueDate: null,
    ...o,
  };
}

describe("computeTodayRoutineItems", () => {
  it("includes today's occurrence for an active daily standalone routine", () => {
    const items = computeTodayRoutineItems([routine()], [], new Map());
    expect(items.some((i) => i.scheduledDate === TODAY)).toBe(true);
  });

  it("excludes archived routines", () => {
    expect(
      computeTodayRoutineItems([routine({ archived: true })], [], new Map())
    ).toEqual([]);
  });

  it("excludes routines of a non-daily-view (paused) project", () => {
    const p = project({ id: "p1", status: "paused" });
    const items = computeTodayRoutineItems(
      [routine({ projectId: "p1" })],
      [],
      new Map([["p1", p]])
    );
    expect(items).toEqual([]);
  });

  it("drops a date that is already completed", () => {
    const occ: RoutineOccurrence = {
      id: "o1",
      routineId: "r1",
      scheduledDate: TODAY,
      completedAt: TODAY,
      note: "",
      created: TODAY,
    };
    const items = computeTodayRoutineItems([routine()], [occ], new Map());
    expect(items.some((i) => i.scheduledDate === TODAY)).toBe(false);
  });
});

describe("routineCounts", () => {
  it("splits overdue vs today", () => {
    const items: TodayRoutineItem[] = [
      { routine: routine(), scheduledDate: "2000-01-01" },
      { routine: routine(), scheduledDate: TODAY },
    ];
    expect(routineCounts(items)).toEqual({ overdue: 1, dueToday: 1, total: 2 });
  });
});

describe("routineEffortHours", () => {
  it("sums effort and rounds to 1 decimal", () => {
    const items: TodayRoutineItem[] = [
      { routine: routine({ effortHours: 1.25 }), scheduledDate: TODAY },
      { routine: routine({ effortHours: 0.5 }), scheduledDate: TODAY },
    ];
    expect(routineEffortHours(items)).toBe(1.8);
  });
});
