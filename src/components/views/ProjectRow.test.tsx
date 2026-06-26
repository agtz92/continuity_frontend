/**
 * Render smoke tests for ProjectRow (extracted from ProjectsView's renderRow,
 * see AUDITORIA_CODIGO.md). Verifies the extracted component still renders the
 * collapsed header, toggles the expanded detail, and wires the row click — the
 * behavioral checks that tsc/build can't cover. next-intl and Supabase are
 * mocked globally in vitest.setup.ts; NotesSection uses Apollo so we wrap in
 * MockedProvider.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import type { Project, Task } from "@/lib/types";
import { ProjectRow } from "./ProjectRow";

const NOW = new Date().toISOString();

function proj(o: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "My Project",
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
    ...o,
  };
}

function task(o: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "A task",
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
    ...o,
  };
}

function renderRow(opts: {
  project: Project;
  selectedProject?: Project | null;
  tasks?: Task[];
}) {
  const handlers = {
    onSelectProject: vi.fn(),
    onOpenProject: vi.fn(),
    onAddTaskToProject: vi.fn(),
    onLogUpdate: vi.fn(),
    onToggleTask: vi.fn(),
    onEditTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onEditProject: vi.fn(),
    onDeleteProject: vi.fn(),
  };
  const utils = render(
    <MockedProvider>
      <ProjectRow
        project={opts.project}
        selectedProject={opts.selectedProject ?? null}
        tasks={opts.tasks ?? []}
        activities={[]}
        notesByProject={{}}
        categoryById={{}}
        {...handlers}
      />
    </MockedProvider>
  );
  return { ...utils, handlers };
}

describe("ProjectRow", () => {
  it("renders the project name in the collapsed header", () => {
    renderRow({ project: proj({ name: "Launch plan" }) });
    expect(screen.getByText("Launch plan")).toBeInTheDocument();
  });

  it("calls onSelectProject with the project when the header is clicked", async () => {
    const user = userEvent.setup();
    const p = proj({ name: "Clickable" });
    const { handlers } = renderRow({ project: p });
    await user.click(screen.getByText("Clickable"));
    expect(handlers.onSelectProject).toHaveBeenCalledWith(p);
  });

  it("hides expanded-only detail when collapsed", () => {
    renderRow({
      project: proj({ why: "WHY-UNIQUE-123", description: "DESC-UNIQUE-456" }),
      tasks: [task({ title: "TASK-UNIQUE-789" })],
    });
    expect(screen.queryByText("WHY-UNIQUE-123")).not.toBeInTheDocument();
    expect(screen.queryByText("DESC-UNIQUE-456")).not.toBeInTheDocument();
    expect(screen.queryByText("TASK-UNIQUE-789")).not.toBeInTheDocument();
  });

  it("shows why, description and tasks when expanded (selected)", () => {
    const p = proj({ why: "WHY-UNIQUE-123", description: "DESC-UNIQUE-456" });
    renderRow({
      project: p,
      selectedProject: p,
      tasks: [task({ title: "TASK-UNIQUE-789" })],
    });
    expect(screen.getByText("WHY-UNIQUE-123")).toBeInTheDocument();
    expect(screen.getByText("DESC-UNIQUE-456")).toBeInTheDocument();
    expect(screen.getByText("TASK-UNIQUE-789")).toBeInTheDocument();
  });
});
