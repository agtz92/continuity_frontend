/**
 * Smoke render tests for the section components extracted from TodayView
 * (see AUDITORIA_CODIGO.md). They confirm each component mounts with realistic
 * props (catching missing-prop / hook-misuse regressions) and renders content.
 * next-intl is mocked globally in vitest.setup.ts.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { TodayFocusSection } from "./TodayFocusSection";
import { DoneTodaySection } from "./DoneTodaySection";

describe("TodayFocusSection", () => {
  it("mounts and renders its empty state without throwing", () => {
    // It reschedules overdue tasks in place (useTaskMutations), so it needs
    // an Apollo client in context like any other writer.
    const { container } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <TodayFocusSection
          todayFocus={{ items: [], total: 0 }}
          todayTaskCounts={{ total: 0, dueToday: 0, overdue: 0 }}
          todayEffortHours={0}
          projects={[]}
          onToggleTask={vi.fn()}
          onEditTask={vi.fn()}
          onJumpToProject={vi.fn()}
          onJumpToTasks={vi.fn()}
        />
      </MockedProvider>
    );
    expect(container.textContent ?? "").not.toBe("");
  });
});

describe("DoneTodaySection", () => {
  it("mounts with no items without throwing", () => {
    const { container } = render(
      <DoneTodaySection
        doneTodayItems={[]}
        doneTodayEffortHours={0}
        todayHoursByProject={[]}
        projects={[]}
        onJumpToProject={vi.fn()}
        onEditTask={vi.fn()}
        onToggleTask={vi.fn()}
        onUncompleteOccurrence={vi.fn()}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
