import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/apollo", () => ({ apolloClient: {} }));

import { deltaSince, mergeDelta, removeFromDashboard } from "./dashboardSync";

const prev = {
  dashboard: {
    projects: [{ id: "p1", name: "viejo" }],
    activities: [{ id: "a1" }],
    ideas: [{ id: "i1" }, { id: "i2" }],
  },
};

describe("mergeDelta", () => {
  it("reemplaza proyectos, agrega activities nuevas y deja lo demás", () => {
    const out = mergeDelta(prev, {
      projects: [{ id: "p1", name: "nuevo" }, { id: "p2" }],
      activities: [{ id: "a2" }, { id: "a1" }],
    });
    expect(out?.dashboard?.projects).toEqual([{ id: "p1", name: "nuevo" }, { id: "p2" }]);
    expect(out?.dashboard?.activities).toEqual([{ id: "a2" }, { id: "a1" }]);
    expect(out?.dashboard?.ideas).toBe(prev.dashboard.ideas);
  });

  it("sin dashboard cacheado no toca nada", () => {
    expect(mergeDelta(undefined, { projects: [], activities: [] })).toBeUndefined();
  });
});

describe("removeFromDashboard", () => {
  it("saca el id de la lista", () => {
    const out = removeFromDashboard(prev, "ideas", "i1");
    expect(out?.dashboard?.ideas).toEqual([{ id: "i2" }]);
  });

  it("no toca nada si el id no está o no hay caché", () => {
    expect(removeFromDashboard(prev, "ideas", "nope")).toBeUndefined();
    expect(removeFromDashboard(null, "ideas", "i1")).toBeUndefined();
  });
});

describe("deltaSince", () => {
  it("parte de la activity más nueva menos el margen", () => {
    expect(
      deltaSince([{ created: "2026-11-06T10:00:00.000Z" }, { created: "2026-11-06T12:00:00.000Z" }])
    ).toBe("2026-11-06T11:55:00.000Z");
  });

  it("sin activities usa la última hora", () => {
    expect(deltaSince([], Date.parse("2026-11-06T12:00:00.000Z"))).toBe(
      "2026-11-06T11:00:00.000Z"
    );
  });
});
