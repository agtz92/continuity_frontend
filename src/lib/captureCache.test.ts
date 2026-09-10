/**
 * Escribir en la caché es lo que hace que una captura aparezca al instante en
 * vez de al segundo y pico. Los dos casos que importan son los de **no
 * escribir**: sin caché previa (escribiríamos un dashboard falso con un solo
 * elemento) y con el id ya dentro (duplicaríamos el renglón).
 */

import { describe, it, expect } from "vitest";

import { insertIntoDashboard } from "./captureCache";

const dashboard = (over: Record<string, unknown> = {}) => ({
  dashboard: { tasks: [], ideas: [], activities: [], ...over },
});

describe("insertIntoDashboard", () => {
  it("mete lo capturado al principio de su lista", () => {
    const previous = dashboard({ activities: [{ id: "a1" }] });

    const next = insertIntoDashboard(previous, "activities", { id: "a2" });

    expect(next?.dashboard.activities).toEqual([{ id: "a2" }, { id: "a1" }]);
  });

  it("no toca las otras listas", () => {
    const previous = dashboard({ tasks: [{ id: "t1" }], ideas: [{ id: "i1" }] });

    const next = insertIntoDashboard(previous, "tasks", { id: "t2" });

    expect(next?.dashboard.ideas).toEqual([{ id: "i1" }]);
    expect(next?.dashboard.tasks).toHaveLength(2);
  });

  it("sin caché previa no escribe: la primera carga es de la query", () => {
    expect(insertIntoDashboard(null, "tasks", { id: "t1" })).toBeUndefined();
    expect(insertIntoDashboard({}, "tasks", { id: "t1" })).toBeUndefined();
  });

  it("si el id ya está, no duplica (el refetch pudo llegar antes)", () => {
    const previous = dashboard({ tasks: [{ id: "t1" }] });

    expect(insertIntoDashboard(previous, "tasks", { id: "t1" })).toBeUndefined();
  });

  it("sin entidad —una mutación que no devolvió nada— no escribe", () => {
    const previous = dashboard();

    expect(insertIntoDashboard(previous, "tasks", null)).toBeUndefined();
    expect(insertIntoDashboard(previous, "tasks", undefined)).toBeUndefined();
  });

  it("si la lista cacheada no es una lista, se deja en paz", () => {
    const previous = { dashboard: { tasks: null } };

    expect(insertIntoDashboard(previous, "tasks", { id: "t1" })).toBeUndefined();
  });

  it("no muta lo anterior: Apollo compara por referencia para re-renderizar", () => {
    const list = [{ id: "t1" }];
    const previous = dashboard({ tasks: list });

    const next = insertIntoDashboard(previous, "tasks", { id: "t2" });

    expect(previous.dashboard.tasks).toBe(list);
    expect(list).toHaveLength(1);
    expect(next).not.toBe(previous);
  });
});
