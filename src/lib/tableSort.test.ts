import { describe, expect, it } from "vitest";
import {
  compareSortValues,
  nextSortState,
  sortRows,
  toSortableTime,
  type SortState,
} from "./tableSort";

type Row = { id: string; name: string | null; n: number | null; flag: boolean };

const rows: Row[] = [
  { id: "a", name: "Carlos", n: 2, flag: false },
  { id: "b", name: null, n: null, flag: true },
  { id: "c", name: "ana", n: 10, flag: false },
  { id: "d", name: "Ángel", n: 9, flag: true },
];

const get = (row: Row, key: "name" | "n" | "flag") => row[key];

const ids = (list: Row[]) => list.map((r) => r.id).join("");

describe("sortRows", () => {
  it("sin estado deja el orden del servidor", () => {
    expect(ids(sortRows(rows, null, get))).toBe("abcd");
  });

  it("ordena texto ignorando acentos y mayúsculas", () => {
    expect(ids(sortRows(rows, { key: "name", dir: "asc" }, get))).toBe("cdab");
  });

  it("ordena números y respeta la dirección", () => {
    expect(ids(sortRows(rows, { key: "n", dir: "asc" }, get))).toBe("adcb");
    expect(ids(sortRows(rows, { key: "n", dir: "desc" }, get))).toBe("cdab");
  });

  it("los vacíos quedan al final en ambas direcciones", () => {
    const asc = sortRows(rows, { key: "n", dir: "asc" }, get);
    const desc = sortRows(rows, { key: "n", dir: "desc" }, get);
    expect(asc[asc.length - 1].id).toBe("b");
    expect(desc[desc.length - 1].id).toBe("b");
  });

  it("booleanos: descendente deja los marcados arriba", () => {
    const desc = sortRows(rows, { key: "flag", dir: "desc" }, get);
    expect(desc.slice(0, 2).every((r) => r.flag)).toBe(true);
  });

  it("es estable: los empates conservan el orden original", () => {
    const sorted = sortRows(rows, { key: "flag", dir: "asc" }, get);
    expect(ids(sorted)).toBe("acbd");
  });

  it("no muta el arreglo original", () => {
    const original = [...rows];
    sortRows(rows, { key: "n", dir: "desc" }, get);
    expect(rows).toEqual(original);
  });
});

describe("compareSortValues", () => {
  it("compara cadenas con números embebidos de forma natural", () => {
    expect(compareSortValues("item9", "item10")).toBeLessThan(0);
  });

  it("deja el vacío después del valor", () => {
    expect(compareSortValues(null, 3)).toBeGreaterThan(0);
    expect(compareSortValues(3, null)).toBeLessThan(0);
    expect(compareSortValues(null, undefined)).toBe(0);
  });
});

describe("nextSortState", () => {
  it("cicla por defecto → contraria → sin orden", () => {
    let state: SortState<"n"> = null;
    state = nextSortState(state, "n", "desc");
    expect(state).toEqual({ key: "n", dir: "desc" });
    state = nextSortState(state, "n", "desc");
    expect(state).toEqual({ key: "n", dir: "asc" });
    state = nextSortState(state, "n", "desc");
    expect(state).toBeNull();
  });

  it("otra columna arranca su propio ciclo", () => {
    const state = nextSortState<"n" | "name">({ key: "n", dir: "asc" }, "name", "asc");
    expect(state).toEqual({ key: "name", dir: "asc" });
  });
});

describe("toSortableTime", () => {
  it("convierte ISO a número y devuelve null para lo que no es fecha", () => {
    expect(toSortableTime("2026-10-26T00:00:00Z")).toBe(
      Date.parse("2026-10-26T00:00:00Z")
    );
    expect(toSortableTime(null)).toBeNull();
    expect(toSortableTime("no es fecha")).toBeNull();
  });
});
