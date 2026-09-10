/**
 * `reconcileLayout` es el espejo en cliente de `get_today_layout` del backend.
 * Si los dos no dicen lo mismo, el Home parpadea: se pinta una cosa y al llegar
 * la respuesta del servidor se pinta otra.
 *
 * El fallo que hay que evitar es silencioso: **una sección en las dos columnas**
 * se pinta dos veces y nadie ve un error.
 */

import { describe, it, expect } from "vitest";

import { reconcileLayout } from "./useTodayLayout";
import { TODAY_SECTION_IDS } from "@/lib/todaySections";

describe("reconcileLayout", () => {
  it("sin nada guardado, todo va a la columna principal", () => {
    const r = reconcileLayout(undefined);
    expect(r.order).toEqual([...TODAY_SECTION_IDS]);
    expect(r.rail).toEqual([]);
  });

  it("el rail manda: lo que está en las dos listas sale de `order`", () => {
    const r = reconcileLayout({
      order: [...TODAY_SECTION_IDS],
      hidden: [],
      rail: ["cooling", "stopped"],
    });
    expect(r.rail).toEqual(["cooling", "stopped"]);
    expect(r.order).not.toContain("cooling");
    expect(r.order).not.toContain("stopped");
  });

  it("entre las dos columnas cubren la lista canónica entera", () => {
    const r = reconcileLayout({
      order: ["today-focus"],
      hidden: [],
      rail: ["cooling"],
    });
    expect(new Set([...r.order, ...r.rail])).toEqual(new Set(TODAY_SECTION_IDS));
  });

  it("una sección nueva del código aparece al final de la principal", () => {
    const partial = TODAY_SECTION_IDS.filter((s) => s !== "log-tail");
    const r = reconcileLayout({ order: [...partial], hidden: [], rail: [] });
    expect(r.order[r.order.length - 1]).toBe("log-tail");
  });

  it("descarta ids que ya no existen en el código", () => {
    const r = reconcileLayout({
      order: ["seccion-fantasma", "today-focus"],
      hidden: ["otra-fantasma"],
      rail: ["tercera-fantasma"],
    });
    expect(r.order).not.toContain("seccion-fantasma");
    expect(r.rail).toEqual([]);
    expect(r.hidden.size).toBe(0);
  });

  it("no deja ocultar una sección bloqueada", () => {
    const r = reconcileLayout({
      order: [...TODAY_SECTION_IDS],
      hidden: ["today-focus"],
      rail: [],
    });
    expect(r.hidden.has("today-focus")).toBe(false);
  });

  it("una respuesta vieja sin `rail` no rompe: el lateral queda vacío", () => {
    const r = reconcileLayout({ order: [...TODAY_SECTION_IDS], hidden: [] });
    expect(r.rail).toEqual([]);
    expect(r.order).toHaveLength(TODAY_SECTION_IDS.length);
  });
});
