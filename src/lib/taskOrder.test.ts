import { describe, expect, it } from "vitest";
import { suggestDueDateAfterMove } from "./taskOrder";

const D = (day: number) => `2026-10-${String(day).padStart(2, "0")}T00:00:00+00:00`;
const t = (id: string, day: number | null) => ({ id, dueDate: day ? D(day) : null });

describe("suggestDueDateAfterMove", () => {
  it("al subir toma la fecha de la tarea que rebasó (la de abajo)", () => {
    const ordered = [t("a", 19), t("moved", 29), t("b", 21)];
    expect(suggestDueDateAfterMove(ordered, "moved", "up")).toBe(D(21));
  });

  it("al bajar toma la fecha de la tarea que rebasó (la de arriba)", () => {
    const ordered = [t("a", 21), t("moved", 19), t("b", 25)];
    expect(suggestDueDateAfterMove(ordered, "moved", "down")).toBe(D(21));
  });

  it("subir al primer lugar usa la de abajo; bajar al último, la de arriba", () => {
    expect(suggestDueDateAfterMove([t("moved", 29), t("a", 19)], "moved", "up")).toBe(D(19));
    expect(suggestDueDateAfterMove([t("a", 29), t("moved", 19)], "moved", "down")).toBe(D(29));
  });

  it("si la vecina rebasada no tiene fecha, usa la del otro lado", () => {
    const ordered = [t("a", 20), t("moved", null), t("b", null)];
    expect(suggestDueDateAfterMove(ordered, "moved", "up")).toBe(D(20));
  });

  it("sin fecha propia se sugiere aunque cualquier fecha 'cupiera'", () => {
    const ordered = [t("a", 19), t("moved", null), t("b", 21)];
    expect(suggestDueDateAfterMove(ordered, "moved", "up")).toBe(D(21));
  });

  it("no sugiere nada si su fecha ya respeta el nuevo orden", () => {
    const ordered = [t("a", 19), t("moved", 20), t("b", 21)];
    expect(suggestDueDateAfterMove(ordered, "moved", "up")).toBeNull();
    expect(suggestDueDateAfterMove(ordered, "moved", "down")).toBeNull();
  });

  it("no sugiere nada si ninguna vecina tiene fecha", () => {
    const ordered = [t("a", null), t("moved", 20), t("b", null)];
    expect(suggestDueDateAfterMove(ordered, "moved", "up")).toBeNull();
  });
});
