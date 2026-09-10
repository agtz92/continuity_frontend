/**
 * Lo que se prueba aquí es la parte que **no existe en la base de datos**: una
 * ocurrencia saltada es la ausencia de una fila en una fecha que la regla sí
 * programaba, y la racha se cuenta cruzando las dos cosas. Si esto se desvía,
 * la regla de bloques miente sin que nada falle.
 */

import { describe, it, expect } from "vitest";

import type { Routine } from "@/lib/types";
import {
  buildOccurrenceRule,
  currentStreak,
  hasNoFutureOccurrences,
} from "./routineHistory";

const TODAY = "2026-03-10"; // martes

/** Diaria, arrancada mucho antes de la ventana. */
function daily(overrides: Partial<Routine> = {}): Routine {
  return {
    id: "r1",
    title: "Revisar el buzón",
    description: "",
    recurrenceType: "every_n",
    startDate: "2025-01-01",
    endDate: null,
    weekdays: [],
    intervalN: 1,
    intervalUnit: "days",
    monthlyDay: null,
    effortHours: null,
    archived: false,
    created: "2025-01-01T00:00:00Z",
    projectId: null,
    timeOfDay: null,
    durationMinutes: null,
    ...overrides,
  };
}

/** Los `n` días que terminan en `TODAY`, incluido. */
function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(TODAY + "T00:00:00");
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

describe("buildOccurrenceRule", () => {
  it("marca saltada la fecha que tocaba y no tiene ocurrencia", () => {
    const days = lastDays(4); // ..., ayer, hoy
    const completed = new Set([days[0], days[2]]);
    const marks = buildOccurrenceRule(daily(), completed, TODAY, 4);

    expect(marks.slice(0, 4).map((m) => m.state)).toEqual([
      "done",
      "skipped",
      "done",
      "pending", // hoy: aún no está saltada
    ]);
  });

  it("hoy sin hacer es 'pending', nunca 'skipped'", () => {
    const marks = buildOccurrenceRule(daily(), new Set(), TODAY, 3);
    expect(marks.find((m) => m.date === TODAY)?.state).toBe("pending");
  });

  it("añade la próxima ocurrencia futura al final", () => {
    const marks = buildOccurrenceRule(daily(), new Set(lastDays(30)), TODAY, 5);
    const last = marks[marks.length - 1];
    expect(last.state).toBe("next");
    expect(last.date > TODAY).toBe(true);
  });

  it("una rutina archivada no propone próxima ocurrencia", () => {
    const marks = buildOccurrenceRule(
      daily({ archived: true }),
      new Set(lastDays(30)),
      TODAY,
      5
    );
    expect(marks.some((m) => m.state === "next")).toBe(false);
    expect(hasNoFutureOccurrences(marks)).toBe(true);
  });

  it("una rutina terminada (end_date pasada) se queda sin ocurrencias por delante", () => {
    const marks = buildOccurrenceRule(
      daily({ endDate: "2026-03-01" }),
      new Set(),
      TODAY,
      5
    );
    expect(hasNoFutureOccurrences(marks)).toBe(true);
  });

  it("nunca devuelve más bloques de historia que el límite", () => {
    const marks = buildOccurrenceRule(daily(), new Set(), TODAY, 6);
    expect(marks.filter((m) => m.state !== "next")).toHaveLength(6);
  });
});

describe("currentStreak", () => {
  it("cuenta las seguidas hacia atrás y se para en el primer hueco", () => {
    const days = lastDays(6);
    // hueco en days[1]; después, tres seguidas antes de hoy
    const completed = new Set([days[0], days[2], days[3], days[4]]);
    expect(currentStreak(daily(), completed, TODAY)).toBe(3);
  });

  it("hoy pendiente no rompe la racha", () => {
    const days = lastDays(4);
    const completed = new Set([days[0], days[1], days[2]]); // hoy = days[3], sin hacer
    expect(currentStreak(daily(), completed, TODAY)).toBe(3);
  });

  it("hoy hecho suma a la racha", () => {
    const days = lastDays(3);
    expect(currentStreak(daily(), new Set(days), TODAY)).toBe(3);
  });

  it("sin ocurrencias la racha es cero, no negativa", () => {
    expect(currentStreak(daily(), new Set(), TODAY)).toBe(0);
  });
});
