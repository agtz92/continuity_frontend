/**
 * La regla que se protege aquí es la que hace legible el Home: **el
 * protagonista no se repite abajo**. Sin eso, un proyecto atorado y frío sale
 * tres veces en la misma pantalla y la jerarquía deja de significar nada.
 */

import { describe, it, expect } from "vitest";

import type { Activity, Project } from "@/lib/types";
import {
  coolingProjects,
  pickResumeThread,
  stoppedProjects,
} from "./homeSignals";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Migración legacy",
    description: "",
    why: "",
    nextStep: "",
    status: "active",
    priority: "medium",
    categoryId: null,
    lastActivity: "2026-03-01T10:00:00Z",
    created: "2026-01-01T00:00:00Z",
    dueDate: null,
    ...overrides,
  };
}

function note(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    kind: "note",
    entityId: null,
    entityTitle: "",
    projectId: "p1",
    targetProjectId: null,
    note: "Quedé esperando el acceso al DNS",
    previousValue: "",
    newValue: "",
    created: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

describe("pickResumeThread", () => {
  it("elige el último proyecto vivo con movimiento", () => {
    const r = pickResumeThread(
      [
        project({ id: "viejo", lastActivity: "2026-01-05T00:00:00Z" }),
        project({ id: "nuevo", lastActivity: "2026-03-08T00:00:00Z" }),
      ],
      []
    );
    expect(r?.project.id).toBe("nuevo");
  });

  it("ignora pausados y muertos: no piden ser retomados", () => {
    const r = pickResumeThread(
      [
        project({ id: "muerto", status: "killed", lastActivity: "2026-03-09T00:00:00Z" }),
        project({ id: "pausado", status: "paused", lastActivity: "2026-03-08T00:00:00Z" }),
        project({ id: "vivo", lastActivity: "2026-01-01T00:00:00Z" }),
      ],
      []
    );
    expect(r?.project.id).toBe("vivo");
  });

  it("cita el último update ESCRITO, no el último evento del sistema", () => {
    const r = pickResumeThread(
      [project()],
      [
        note({ id: "vieja", created: "2026-02-01T00:00:00Z", note: "antigua" }),
        note({ id: "nueva", created: "2026-03-01T00:00:00Z", note: "reciente" }),
        note({
          id: "evento",
          kind: "task_completed",
          created: "2026-03-05T00:00:00Z",
          note: "no debería citarse",
        }),
      ]
    );
    expect(r?.lastNote?.id).toBe("nueva");
  });

  it("no cita updates de otro proyecto", () => {
    const r = pickResumeThread(
      [project({ id: "p1" })],
      [note({ projectId: "otro" })]
    );
    expect(r?.lastNote).toBeNull();
  });

  it("sin proyectos vivos no hay bloque", () => {
    expect(pickResumeThread([project({ status: "killed" })], [])).toBeNull();
  });
});

describe("stoppedProjects", () => {
  it("ordena por antigüedad del bloqueo, lo más viejo primero", () => {
    const list = stoppedProjects([
      project({ id: "reciente", isBlocked: true, blockedSince: "2026-03-05" }),
      project({ id: "viejo", isBlocked: true, blockedSince: "2026-01-10" }),
    ]);
    expect(list.map((p) => p.id)).toEqual(["viejo", "reciente"]);
  });

  it("excluye al protagonista: su blocker ya se lee arriba", () => {
    const list = stoppedProjects(
      [
        project({ id: "protagonista", isBlocked: true, blockedSince: "2026-01-01" }),
        project({ id: "otro", isBlocked: true, blockedSince: "2026-02-01" }),
      ],
      "protagonista"
    );
    expect(list.map((p) => p.id)).toEqual(["otro"]);
  });

  it("un proyecto sin blockedSince no adelanta a los que sí lo traen", () => {
    const list = stoppedProjects([
      project({ id: "sin-fecha", isBlocked: true }),
      project({ id: "con-fecha", isBlocked: true, blockedSince: "2026-03-01" }),
    ]);
    expect(list[0].id).toBe("con-fecha");
  });
});

describe("coolingProjects", () => {
  it("deja fuera lo templado", () => {
    const list = coolingProjects([
      project({ id: "templado", cooling: "warm", daysSinceTouch: 2 }),
      project({ id: "frio", cooling: "cold", daysSinceTouch: 40 }),
    ]);
    expect(list.map((e) => e.project.id)).toEqual(["frio"]);
  });

  it("lo más frío arriba y corta en el límite", () => {
    const list = coolingProjects(
      [
        project({ id: "a", cooling: "cool", daysSinceTouch: 10 }),
        project({ id: "b", cooling: "cold", daysSinceTouch: 50 }),
        project({ id: "c", cooling: "cold", daysSinceTouch: 30 }),
        project({ id: "d", cooling: "cool", daysSinceTouch: 9 }),
      ],
      { limit: 2 }
    );
    expect(list.map((e) => e.project.id)).toEqual(["b", "c"]);
  });

  it("lo atorado no cuenta como enfriándose: son dos problemas distintos", () => {
    const list = coolingProjects([
      project({ id: "atorado", cooling: "cold", daysSinceTouch: 40, isBlocked: true }),
      project({ id: "abandonado", cooling: "cold", daysSinceTouch: 30 }),
    ]);
    expect(list.map((e) => e.project.id)).toEqual(["abandonado"]);
  });

  it("un proyecto lanzado NO se enfría: está terminado, no abandonado", () => {
    const list = coolingProjects([
      project({ id: "lanzado", status: "launched", cooling: "cold", daysSinceTouch: 60 }),
      project({ id: "activo", cooling: "cold", daysSinceTouch: 30 }),
    ]);
    expect(list.map((e) => e.project.id)).toEqual(["activo"]);
  });

  it("estancado tampoco: ya tiene su propio bloque", () => {
    const list = coolingProjects([
      project({ id: "estancado", status: "stalled", cooling: "cold", daysSinceTouch: 60 }),
    ]);
    expect(list).toHaveLength(0);
  });

  it("sin campos del servidor cae al cálculo local por lastActivity", () => {
    const old = new Date();
    old.setDate(old.getDate() - 30);
    const list = coolingProjects([
      project({ id: "viejo", lastActivity: old.toISOString() }),
      project({ id: "hoy", lastActivity: new Date().toISOString() }),
    ]);
    expect(list.map((e) => e.project.id)).toEqual(["viejo"]);
  });
});
