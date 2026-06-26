/**
 * Unit tests for the pure project filter/sort logic extracted from
 * ProjectsView (see AUDITORIA_CODIGO.md). Date-dependent cases use a fixed
 * far-past date so they don't depend on "today".
 */

import { describe, it, expect } from "vitest";
import type { Category, Project, Task } from "@/lib/types";
import {
  compareProjects,
  matchesDue,
  matchesSearch,
  urgencyBucket,
} from "./projectSort";

const NOW = new Date().toISOString();

function proj(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Project",
    description: "",
    why: "",
    nextStep: "",
    status: "active",
    priority: "medium",
    categoryId: null,
    lastActivity: NOW,
    created: NOW,
    dueDate: null,
    position: 0,
    ...overrides,
  };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Task",
    projectId: "p1",
    dueDate: null,
    done: false,
    completedAt: null,
    created: NOW,
    effortHours: null,
    dueTime: null,
    durationMinutes: null,
    parkedDueDate: null,
    parkedDueTime: null,
    blockers: [],
    ...overrides,
  };
}

describe("matchesSearch", () => {
  it("returns true for an empty query", () => {
    expect(matchesSearch(proj({ name: "anything" }), "", {})).toBe(true);
  });

  it("matches on name, description and category name", () => {
    const cats: Record<string, Category> = {
      c1: { id: "c1", name: "Marketing", color: "emerald", created: NOW },
    };
    expect(matchesSearch(proj({ name: "Launch plan" }), "launch", {})).toBe(true);
    expect(matchesSearch(proj({ description: "big idea" }), "idea", {})).toBe(true);
    expect(
      matchesSearch(proj({ categoryId: "c1" }), "marketing", cats)
    ).toBe(true);
    expect(matchesSearch(proj({ name: "Launch" }), "zzz", {})).toBe(false);
  });
});

describe("matchesDue", () => {
  it("'all' passes everything, 'none' only undated", () => {
    expect(matchesDue(proj({ dueDate: "2000-01-01" }), "all", "")).toBe(true);
    expect(matchesDue(proj({ dueDate: null }), "none", "")).toBe(true);
    expect(matchesDue(proj({ dueDate: "2000-01-01" }), "none", "")).toBe(false);
  });

  it("'overdue' is strictly before today", () => {
    expect(matchesDue(proj({ dueDate: "2000-01-01" }), "overdue", "")).toBe(true);
  });
});

describe("urgencyBucket", () => {
  it("0 when a pending task is overdue", () => {
    const tasks = [task({ dueDate: "2000-01-01", done: false })];
    expect(urgencyBucket(proj(), tasks)).toBe(0);
  });

  it("2 when an active project is idle >= 7 days with no urgent tasks", () => {
    expect(urgencyBucket(proj({ lastActivity: "2000-01-01" }), [])).toBe(2);
  });

  it("3 for a recently-active project with no tasks", () => {
    expect(urgencyBucket(proj({ lastActivity: NOW }), [])).toBe(3);
  });
});

describe("compareProjects", () => {
  const ctx = { locale: "en", tasks: [] as Task[] };

  it("name mode sorts alphabetically", () => {
    const list = [proj({ id: "b", name: "Banana" }), proj({ id: "a", name: "Apple" })];
    list.sort((a, b) => compareProjects(a, b, { ...ctx, sortMode: "name" }));
    expect(list.map((p) => p.name)).toEqual(["Apple", "Banana"]);
  });

  it("manual mode sorts by position, then name as tiebreaker", () => {
    const list = [
      proj({ id: "x", name: "Z", position: 0 }),
      proj({ id: "y", name: "A", position: 0 }),
      proj({ id: "z", name: "M", position: -1 }),
    ];
    list.sort((a, b) => compareProjects(a, b, { ...ctx, sortMode: "manual" }));
    // position -1 first; then the two position-0 broken by name (A before Z).
    expect(list.map((p) => p.name)).toEqual(["M", "A", "Z"]);
  });

  it("smart mode puts the more urgent project first", () => {
    const overdueTasks = [task({ projectId: "late", dueDate: "2000-01-01" })];
    const a = proj({ id: "late", name: "Late", lastActivity: NOW });
    const b = proj({ id: "calm", name: "Calm", lastActivity: NOW });
    const list = [b, a];
    list.sort((x, y) =>
      compareProjects(x, y, { sortMode: "smart", locale: "en", tasks: overdueTasks })
    );
    expect(list[0].name).toBe("Late");
  });
});
