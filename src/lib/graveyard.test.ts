/**
 * "De qué murió" es **derivado**, no un campo. Lo que se protege aquí es el
 * orden de las reglas: casi todo proyecto muerto tiene `killedReason`, así que
 * si "a propósito" ganara, la columna diría lo mismo siempre y no serviría.
 */

import { describe, it, expect } from "vitest";

import type { Project, Task, TaskBlocker } from "@/lib/types";
import {
  averageLifespan,
  causeOfDeath,
  dominantCause,
  lifespanDays,
} from "./graveyard";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Migración legacy",
    description: "",
    why: "",
    nextStep: "Llamar al proveedor",
    status: "killed",
    priority: "medium",
    categoryId: null,
    lastActivity: "2026-02-01T00:00:00Z",
    created: "2026-01-01T00:00:00Z",
    dueDate: null,
    killedReason: "Ya no tenía sentido",
    killedAt: "2026-01-31T00:00:00Z",
    ...overrides,
  };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Tarea",
    projectId: "p1",
    dueDate: null,
    done: false,
    completedAt: null,
    created: "2026-01-02T00:00:00Z",
    effortHours: null,
    dueTime: null,
    durationMinutes: null,
    parkedDueDate: null,
    parkedDueTime: null,
    blockers: [],
    ...overrides,
  };
}

const blocker: TaskBlocker = {
  id: "b1",
  blockedTaskId: "t1",
  blockingTaskId: null,
  externalDescription: "Esperando el contrato",
  created: "2026-01-10T00:00:00Z",
};

describe("causeOfDeath", () => {
  it("atorado gana a 'a propósito', aunque haya razón escrita", () => {
    const p = project(); // trae killedReason
    expect(causeOfDeath(p, [task({ blockers: [blocker] })])).toBe("blocked");
  });

  it("una tarea bloqueada YA CERRADA no cuenta: se resolvió", () => {
    const p = project();
    expect(
      causeOfDeath(p, [task({ done: true, blockers: [blocker] })])
    ).toBe("deliberate");
  });

  it("sin siguiente paso y sin nada cerrado: nunca arrancó", () => {
    const p = project({ nextStep: "   " });
    expect(causeOfDeath(p, [task()])).toBe("noFirstAction");
  });

  it("sin siguiente paso pero con tareas cerradas SÍ arrancó", () => {
    const p = project({ nextStep: "" });
    expect(causeOfDeath(p, [task({ done: true })])).toBe("deliberate");
  });

  it("con razón escrita y nada raro: a propósito", () => {
    expect(causeOfDeath(project(), [task({ done: true })])).toBe("deliberate");
  });

  it("sin razón y sin patrón: se apagó", () => {
    const p = project({ killedReason: "" });
    expect(causeOfDeath(p, [task({ done: true })])).toBe("faded");
  });

  it("solo mira las tareas de SU proyecto", () => {
    const p = project();
    const ajena = task({ id: "x", projectId: "otro", blockers: [blocker] });
    expect(causeOfDeath(p, [ajena])).toBe("deliberate");
  });
});

describe("lifespanDays", () => {
  it("cuenta de creado a muerto, no hasta hoy", () => {
    expect(lifespanDays(project())).toBe(30);
  });

  it("sin fecha de muerte cuenta hasta hoy, y nunca negativo", () => {
    const p = project({ killedAt: null, created: new Date().toISOString() });
    expect(lifespanDays(p)).toBeGreaterThanOrEqual(0);
  });
});

describe("averageLifespan", () => {
  it("promedia y redondea", () => {
    const a = project({ created: "2026-01-01T00:00:00Z", killedAt: "2026-01-11T00:00:00Z" }); // 10
    const b = project({ id: "p2", created: "2026-01-01T00:00:00Z", killedAt: "2026-01-21T00:00:00Z" }); // 20
    expect(averageLifespan([a, b])).toBe(15);
  });

  it("sin muertos devuelve 0, no NaN", () => {
    expect(averageLifespan([])).toBe(0);
  });
});

describe("dominantCause", () => {
  it("una causa que solo sale una vez NO es un patrón", () => {
    const a = project({ id: "a" });
    const b = project({ id: "b", nextStep: "", killedReason: "" });
    expect(dominantCause([a, b], [])).toBeNull();
  });

  it("devuelve la causa repetida con su conteo", () => {
    const a = project({ id: "a", nextStep: "" });
    const b = project({ id: "b", nextStep: "" });
    expect(dominantCause([a, b], [])).toEqual({
      cause: "noFirstAction",
      count: 2,
    });
  });

  it("sin proyectos muertos no hay patrón", () => {
    expect(dominantCause([], [])).toBeNull();
  });
});
