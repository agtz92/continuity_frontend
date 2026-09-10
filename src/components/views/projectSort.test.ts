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
  matchesStatus,
  matchesSearch,
  urgencyBucket,
  smartSectionOf,
  COLLAPSED_SECTIONS,
  SMART_SECTION_ORDER,
  NAME_SIZE_CLASS,
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

describe("orden 'frío primero'", () => {
  const ctx = { sortMode: "cold" as const, locale: "es", tasks: [] as Task[] };

  it("pone arriba lo que lleva más tiempo sin tocarse", () => {
    const frio = proj({ id: "frio", name: "B", daysSinceTouch: 41 });
    const tibio = proj({ id: "tibio", name: "A", daysSinceTouch: 3 });
    expect([tibio, frio].sort((a, b) => compareProjects(a, b, ctx))[0].id).toBe("frio");
  });

  it("cae a lastActivity cuando el servidor no manda daysSinceTouch", () => {
    // Forma cacheada de antes del rediseño: sin el derivado.
    const viejo = proj({ id: "viejo", name: "B", lastActivity: "2020-01-01T00:00:00Z" });
    const nuevo = proj({ id: "nuevo", name: "A", lastActivity: NOW });
    expect([nuevo, viejo].sort((a, b) => compareProjects(a, b, ctx))[0].id).toBe("viejo");
  });

  it("desempata por nombre, como el resto de modos", () => {
    const a = proj({ id: "a", name: "Alfa", daysSinceTouch: 10 });
    const b = proj({ id: "b", name: "Beta", daysSinceTouch: 10 });
    expect([b, a].sort((x, y) => compareProjects(x, y, ctx)).map((p) => p.id)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("filtro 'atorados'", () => {
  it("usa el derivado del servidor, no el estado", () => {
    // Un proyecto activo puede estar atorado y uno stalled puede no estarlo:
    // atoro y enfriamiento son cosas distintas (DP-03).
    expect(matchesStatus(proj({ status: "active", isBlocked: true }), "blocked")).toBe(true);
    expect(matchesStatus(proj({ status: "stalled", isBlocked: false }), "blocked")).toBe(false);
  });

  it("sin el derivado no marca nada como atorado", () => {
    expect(matchesStatus(proj(), "blocked")).toBe(false);
  });

  it("no cambia el comportamiento de los estados reales ni de 'all'", () => {
    expect(matchesStatus(proj({ status: "paused" }), "paused")).toBe(true);
    expect(matchesStatus(proj({ status: "paused" }), "active")).toBe(false);
    expect(matchesStatus(proj({ status: "killed" }), "all")).toBe(true);
  });
});


/**
 * Las bandas del triaje. La decisión que se protege aquí es que **detenido y
 * vencido son cosas distintas**: el artboard las mezcla en la primera banda y
 * el producto las distingue en todas partes menos, si nadie mira, aquí.
 */
describe("smartSectionOf · bandas del triaje", () => {
  const blocker = {
    id: "b1",
    blockedTaskId: "t1",
    blockingTaskId: null,
    externalDescription: "Esperando el contrato",
    created: NOW,
  };

  it("bloqueado gana a vencido: un proyecto con blocker es 'detenido'", () => {
    const p = proj();
    const t = task({ dueDate: "2020-01-01T00:00:00Z", blockers: [blocker] });
    expect(smartSectionOf(p, [t])).toBe("blocked");
  });

  it("vencido SIN blocker cae en 'en marcha', no en 'detenido'", () => {
    const p = proj();
    const t = task({ dueDate: "2020-01-01T00:00:00Z" });
    expect(smartSectionOf(p, [t])).toBe("active");
  });

  it("una tarea bloqueada YA CERRADA no detiene el proyecto", () => {
    const p = proj();
    const t = task({ done: true, blockers: [blocker] });
    expect(smartSectionOf(p, [t])).toBe("active");
  });

  it("usa `isBlocked` del servidor cuando viene", () => {
    expect(smartSectionOf(proj({ isBlocked: true }), [])).toBe("blocked");
  });

  it("8+ días sin tocar y sin urgencias: 'enfriándose'", () => {
    expect(smartSectionOf(proj({ daysSinceTouch: 30 }), [])).toBe("cooling");
  });

  it("en el límite de 7 días sigue 'en marcha'", () => {
    expect(smartSectionOf(proj({ daysSinceTouch: 7 }), [])).toBe("active");
  });

  it("el estado del modelo manda: en pausa nunca se 'enfría'", () => {
    const p = proj({ status: "paused", daysSinceTouch: 90 });
    expect(smartSectionOf(p, [])).toBe("sleeping");
  });

  it("lanzado tiene su propia banda aunque lleve meses sin tocarse", () => {
    const p = proj({ status: "launched", daysSinceTouch: 200 });
    expect(smartSectionOf(p, [])).toBe("launched");
  });

  it("solo mira las tareas de SU proyecto", () => {
    const ajena = task({ id: "x", projectId: "otro", blockers: [blocker] });
    expect(smartSectionOf(proj(), [ajena])).toBe("active");
  });

  it("durmiendo y lanzados son las que nacen plegadas", () => {
    expect([...COLLAPSED_SECTIONS].sort()).toEqual(["launched", "sleeping"]);
  });

  it("cada banda tiene su cuerpo de nombre", () => {
    for (const band of SMART_SECTION_ORDER) {
      expect(NAME_SIZE_CLASS[band]).toBeTruthy();
    }
  });
});


/**
 * El bug que se coló: el comparador ordenaba por `urgencyBucket` y la cabecera
 * agrupaba por `smartSectionOf`. Dos criterios distintos para lo mismo →
 * las bandas se intercalaban y la misma cabecera salía tres veces.
 */
describe("triaje · el orden agrupa por banda", () => {
  it("todo lo de una banda queda contiguo", () => {
    const ctx = { sortMode: "smart" as const, locale: "en", tasks: [] as Task[] };
    const projects = [
      proj({ id: "lanzado", name: "A", status: "launched" }),
      proj({ id: "frio", name: "B", daysSinceTouch: 40 }),
      proj({ id: "pausa", name: "C", status: "paused" }),
      proj({ id: "vivo", name: "D" }),
      proj({ id: "frio2", name: "E", daysSinceTouch: 30 }),
      proj({ id: "atorado", name: "F", isBlocked: true }),
    ];
    const bands = [...projects]
      .sort((a, b) => compareProjects(a, b, ctx))
      .map((p) => smartSectionOf(p, []));

    // Sin repeticiones: cada banda aparece en un solo tramo.
    const tramos = bands.filter((b, i) => b !== bands[i - 1]);
    expect(tramos).toEqual([...new Set(tramos)]);
  });

  it("y en el orden canónico: detenido primero, lanzado al final", () => {
    const ctx = { sortMode: "smart" as const, locale: "en", tasks: [] as Task[] };
    const projects = [
      proj({ id: "lanzado", name: "A", status: "launched" }),
      proj({ id: "atorado", name: "B", isBlocked: true }),
      proj({ id: "frio", name: "C", daysSinceTouch: 40 }),
    ];
    const orden = [...projects]
      .sort((a, b) => compareProjects(a, b, ctx))
      .map((p) => p.id);
    expect(orden).toEqual(["atorado", "frio", "lanzado"]);
  });
});
