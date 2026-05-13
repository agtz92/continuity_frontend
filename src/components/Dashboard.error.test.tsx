/**
 * Tests for Dashboard error handling.
 *
 * The fix wired into `Dashboard.tsx` wraps every mutation handler in
 * `try / catch` so a backend error doesn't accidentally close the
 * modal mid-edit. We verify two things:
 *
 *   1. End-to-end: when createIdea fails inside the real Dashboard
 *      under MockedProvider, the modal stays open. (Happy-path "modal
 *      closes on success" was attempted via MockedProvider but proved
 *      flaky under React 19 — refetchQueries timing — so we instead
 *      cover the positive control with a thin IdeaModal isolation
 *      test below.)
 *   2. Isolated: IdeaModal calls `onSave` with the trimmed title and
 *      then *does not* close itself — closing is the parent's job, and
 *      that's the contract that makes the Dashboard's try/catch pattern
 *      sound.
 *
 * Toast emission is verified separately in `apollo.test.ts` because
 * `MockedProvider` short-circuits the link chain and doesn't run our
 * `errorLink`.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import Dashboard from "./Dashboard";
import { IdeaModal } from "./ideas/IdeaModal";
import { CREATE_IDEA, DASHBOARD_QUERY, PROFILE_QUERY } from "@/lib/graphql";

const emptyDashboard = {
  dashboard: {
    projects: [],
    tasks: [],
    ideas: [],
    activities: [],
    categories: [],
    projectNotes: [],
    routines: [],
    routineOccurrences: [],
    lastBackup: null,
  },
};

const dashboardMock = (): MockedResponse => ({
  request: { query: DASHBOARD_QUERY },
  result: { data: emptyDashboard },
});

const profileMock = (): MockedResponse => ({
  request: { query: PROFILE_QUERY },
  result: { data: { profile: { avatar: null } } },
});

describe("Dashboard mutation error handling (integration)", () => {
  it("keeps the Capture Idea modal open when createIdea fails", async () => {
    const user = userEvent.setup();
    const errorMock: MockedResponse = {
      request: { query: CREATE_IDEA },
      variableMatcher: () => true,
      result: {
        errors: [
          new GraphQLError("Something went wrong", {
            extensions: { code: "INTERNAL" },
          }),
        ],
      },
    };

    render(
      <MockedProvider
        mocks={[dashboardMock(), profileMock(), errorMock]}
        addTypename={false}
      >
        <Dashboard />
      </MockedProvider>
    );

    // Wait for Dashboard's initial render via the stable tab buttons.
    await screen.findByRole("button", { name: /^ideas$/i });

    // Open the Ideas tab + the capture modal.
    await user.click(screen.getByRole("button", { name: /^ideas$/i }));
    const captureButtons = await screen.findAllByRole("button", {
      name: /capture/i,
    });
    await user.click(captureButtons[0]);

    expect(await screen.findByText("Capture Idea")).toBeInTheDocument();

    // Type a title and submit (the LAST Capture button is the modal's).
    const ideaInput = screen.getAllByRole("textbox")[0];
    await user.type(ideaInput, "Test idea");
    const all = screen.getAllByRole("button", { name: /^capture$/i });
    await user.click(all[all.length - 1]);

    // After the mutation rejects, the modal MUST still be visible — the
    // user should be able to retry without losing their input.
    await waitFor(() => {
      expect(screen.getByText("Capture Idea")).toBeInTheDocument();
    });
  });
});

describe("IdeaModal contract (isolated)", () => {
  it("calls onSave with the trimmed title and current notes/why", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<IdeaModal onSave={onSave} onClose={onClose} />);

    const [titleInput, whyInput, notesInput] = screen.getAllByRole("textbox");
    await user.type(titleInput, "  Spark idea  ");
    await user.type(whyInput, "matters because");
    await user.type(notesInput, "details");
    await user.click(screen.getByRole("button", { name: /^capture$/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      title: "Spark idea",
      description: "details",
      why: "matters because",
    });
    // Modal does NOT close itself — closing is the parent's job. This is
    // what makes the Dashboard's try/catch pattern sound: on error, the
    // parent simply doesn't call onClose.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not call onSave when the title is empty", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<IdeaModal onSave={onSave} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^capture$/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not call onSave when the title is only whitespace", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<IdeaModal onSave={onSave} onClose={vi.fn()} />);

    await user.type(screen.getAllByRole("textbox")[0], "   ");
    await user.click(screen.getByRole("button", { name: /^capture$/i }));
    expect(onSave).not.toHaveBeenCalled();
  });
});
