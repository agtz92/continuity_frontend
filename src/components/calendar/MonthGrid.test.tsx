/**
 * En la rejilla del mes, **la celda entera elige el día**.
 *
 * Estaba roto: solo respondían el número (5×5 px), los chips de tarea/rutina y
 * el enlace "+N más". Un día con una sola tarea, o sin ninguna, tenía casi toda
 * su superficie muerta — se hacía clic en el cuadro y no pasaba nada.
 *
 * El clic vive en un botón hermano en posición absoluta, por detrás del
 * contenido, así que estos tests vigilan las dos mitades del arreglo: que el
 * hueco vacío elija el día, y que los chips sigan siendo botones de verdad
 * (por encima, con su propio título) en vez de quedar tapados.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Category, Project, Task } from "@/lib/types";
import { MonthGrid } from "./MonthGrid";
import type { RoutineItem } from "@/lib/calendar";

const WEEK = [
  "2026-03-09",
  "2026-03-10",
  "2026-03-11",
  "2026-03-12",
  "2026-03-13",
  "2026-03-14",
  "2026-03-15",
];

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Pagar nóminas",
    projectId: null,
    dueDate: "2026-03-10T00:00:00Z",
    done: false,
    completedAt: null,
    created: "2026-03-01T00:00:00Z",
    effortHours: null,
    dueTime: null,
    durationMinutes: null,
    parkedDueDate: null,
    parkedDueTime: null,
    blockers: [],
    ...overrides,
  };
}

function renderGrid(onPickDay = vi.fn(), tasksByDay = new Map<string, Task[]>()) {
  render(
    <MonthGrid
      weeks={[WEEK]}
      refDate={new Date("2026-03-09T00:00:00")}
      todayISO="2026-03-09"
      selectedISO="2026-03-09"
      locale="en"
      weekdayLabels={["M", "T", "W", "T", "F", "S", "S"]}
      tasksByDay={tasksByDay}
      routinesByDay={new Map<string, RoutineItem[]>()}
      projectsById={new Map<string, Project>()}
      categoryById={new Map<string, Category>()}
      showTasks
      showLoad={false}
      handlers={{} as never}
      onPickDay={onPickDay}
      moreLabel={(n) => `+${n} more`}
      pickDayLabel={(iso) => `Pick ${iso}`}
    />
  );
  return onPickDay;
}

describe("MonthGrid · elegir día", () => {
  it("un día VACÍO se elige haciendo clic en la celda", async () => {
    const onPickDay = renderGrid();
    await userEvent.click(screen.getByRole("button", { name: "Pick 2026-03-11" }));
    expect(onPickDay).toHaveBeenCalledWith("2026-03-11");
  });

  it("un día CON una tarea también se elige por el hueco de la celda", async () => {
    const onPickDay = renderGrid(
      vi.fn(),
      new Map([["2026-03-10", [task()]]])
    );
    await userEvent.click(screen.getByRole("button", { name: "Pick 2026-03-10" }));
    expect(onPickDay).toHaveBeenCalledWith("2026-03-10");
  });

  it("el chip de la tarea sigue siendo un botón propio, no queda tapado", async () => {
    const onPickDay = renderGrid(
      vi.fn(),
      new Map([["2026-03-10", [task()]]])
    );
    await userEvent.click(screen.getByRole("button", { name: /pagar nóminas/i }));
    expect(onPickDay).toHaveBeenCalledWith("2026-03-10");
  });

  it("el número del día sigue eligiendo su propio día", async () => {
    const onPickDay = renderGrid();
    await userEvent.click(screen.getByRole("button", { name: "12" }));
    expect(onPickDay).toHaveBeenCalledWith("2026-03-12");
  });

  it("cada día de la semana tiene su propia zona de clic", () => {
    renderGrid();
    for (const iso of WEEK) {
      expect(
        screen.getByRole("button", { name: `Pick ${iso}` })
      ).toBeInTheDocument();
    }
  });
});
