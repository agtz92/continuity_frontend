/**
 * Unit tests for useStalledQueue (extracted from Dashboard, see
 * AUDITORIA_CODIGO.md): one-at-a-time queue of backend-flagged stalled projects.
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Project } from "@/lib/types";
import { useStalledQueue } from "./useStalledQueue";

const proj = (o: Partial<Project>): Project => ({
  id: "p",
  name: "P",
  description: "",
  why: "",
  nextStep: "",
  status: "active",
  priority: "medium",
  categoryId: null,
  lastActivity: "",
  created: "",
  dueDate: null,
  ...o,
});

describe("useStalledQueue", () => {
  it("returns the first stalled project and advances as each is dismissed", () => {
    const projects = [
      proj({ id: "a", status: "active" }),
      proj({ id: "b", status: "stalled" }),
      proj({ id: "c", status: "stalled" }),
    ];
    const { result } = renderHook(() => useStalledQueue(projects));
    expect(result.current.currentStalled?.id).toBe("b");
    act(() => result.current.dismissStalled("b"));
    expect(result.current.currentStalled?.id).toBe("c");
    act(() => result.current.dismissStalled("c"));
    expect(result.current.currentStalled).toBeNull();
  });

  it("is null when there are no stalled projects", () => {
    const { result } = renderHook(() =>
      useStalledQueue([proj({ id: "a", status: "active" })])
    );
    expect(result.current.currentStalled).toBeNull();
  });
});
