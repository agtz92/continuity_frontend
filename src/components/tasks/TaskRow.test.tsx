/**
 * El guardarraíl de tareas bloqueadas.
 *
 * Completar algo que sigue bloqueado no puede ser un click directo: o el
 * bloqueo se levantó y nadie lo registró, o la tarea dejó de importar. Estos
 * tests fijan que el camino feliz (tarea sin blockers) NO cambia, que es lo
 * que de verdad hay que proteger.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";

import { TaskRow } from "./TaskRow";
import type { Task, TaskBlocker } from "@/lib/types";

const NOW = new Date().toISOString();

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Migrar contactos legacy",
    projectId: null,
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

function blocker(overrides: Partial<TaskBlocker> = {}): TaskBlocker {
  return {
    id: "b1",
    blockedTaskId: "t1",
    blockingTaskId: null,
    externalDescription: "Esperando acceso al DNS",
    created: NOW,
    ...overrides,
  };
}

function renderRow(t: Task, onToggle = vi.fn()) {
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      <TaskRow task={t} onToggle={onToggle} onDelete={vi.fn()} />
    </MockedProvider>
  );
  return onToggle;
}

describe("TaskRow · completar", () => {
  it("una tarea sin bloqueo se completa de un click, como siempre", async () => {
    const onToggle = renderRow(task());
    await userEvent.click(screen.getByRole("button", { name: /mark as done/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("una tarea bloqueada NO se completa de un click: pregunta primero", async () => {
    const onToggle = renderRow(task({ blockers: [blocker()] }));
    await userEvent.click(screen.getByRole("button", { name: /mark as done/i }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("desmarcar una tarea ya hecha nunca pregunta, aunque tenga blockers", async () => {
    // `isBlocked` exige `!done`: una tarea cerrada no está bloqueada, así que
    // deshacer sigue siendo un click directo.
    const onToggle = renderRow(task({ done: true, blockers: [blocker()] }));
    await userEvent.click(screen.getByRole("button", { name: /mark as not done/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
