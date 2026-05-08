/**
 * Integration tests for Dashboard error handling.
 *
 * The fix wired into `Dashboard.tsx` wraps every mutation handler in
 * `try / catch` so that a backend error doesn't accidentally close the
 * modal, mark a backup as successful, etc.
 *
 * These tests use Apollo's `MockedProvider` to feed the component a
 * controlled mutation outcome and verify the user-visible behavior:
 *
 *   - On a *failing* createIdea, the "Capture Idea" modal stays open
 *     (the user can correct + retry).
 *   - On a *successful* createIdea, the modal disappears.
 *
 * Toast emission is verified separately in `apollo.test.ts` because
 * `MockedProvider` short-circuits the link chain and doesn't run our
 * `errorLink`.
 */

import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import Dashboard from "./Dashboard";
import { CREATE_IDEA, DASHBOARD_QUERY } from "@/lib/graphql";

const emptyDashboard = {
  dashboard: {
    projects: [],
    tasks: [],
    ideas: [],
    updates: [],
    categories: [],
    lastBackup: null,
  },
};

const dashboardMock = (): MockedResponse => ({
  request: { query: DASHBOARD_QUERY },
  result: { data: emptyDashboard },
});

const createIdeaVariables = {
  data: { title: "Test idea", description: "", why: "" },
};

const openIdeaModalAndType = async () => {
  const user = userEvent.setup();
  // Switch to the Ideas tab.
  await user.click(screen.getByRole("button", { name: /^ideas$/i }));
  // Open the capture modal (header has a Capture button).
  const captureButtons = await screen.findAllByRole("button", {
    name: /capture/i,
  });
  await user.click(captureButtons[0]);

  // Modal title appears.
  expect(await screen.findByText("Capture Idea")).toBeInTheDocument();

  // Type into the autofocused title input. The modal's first <input>.
  const ideaInput = screen.getAllByRole("textbox")[0];
  await user.type(ideaInput, "Test idea");

  // Submit — the LAST "Capture" button in the DOM is the modal submit.
  const all = screen.getAllByRole("button", { name: /^capture$/i });
  await user.click(all[all.length - 1]);

  return user;
};

describe("Dashboard mutation error handling", () => {
  it("keeps the Capture Idea modal open when createIdea fails", async () => {
    const errorMock: MockedResponse = {
      request: { query: CREATE_IDEA, variables: createIdeaVariables },
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
        mocks={[dashboardMock(), errorMock]}
        addTypename={false}
      >
        <Dashboard />
      </MockedProvider>
    );

    // Wait for the dashboard query to resolve before interacting.
    await screen.findByText(/Ideas Parking Lot|Today's Focus|Today/i);

    await openIdeaModalAndType();

    // After the mutation settles with an error, the modal MUST still be
    // visible — the user should be able to retry without losing input.
    await waitFor(() => {
      expect(screen.getByText("Capture Idea")).toBeInTheDocument();
    });
  });

  it("closes the Capture Idea modal when createIdea succeeds", async () => {
    const successMock: MockedResponse = {
      request: { query: CREATE_IDEA, variables: createIdeaVariables },
      result: {
        data: {
          createIdea: {
            id: "new-idea-id",
            title: "Test idea",
            description: "",
            why: "",
            created: new Date().toISOString(),
          },
        },
      },
    };

    // refetchQueries fires DASHBOARD_QUERY again after success.
    render(
      <MockedProvider
        mocks={[dashboardMock(), successMock, dashboardMock()]}
        addTypename={false}
      >
        <Dashboard />
      </MockedProvider>
    );

    await screen.findByText(/Ideas Parking Lot|Today's Focus|Today/i);

    await openIdeaModalAndType();

    // Modal title should disappear once createIdea resolves.
    await waitFor(() => {
      expect(screen.queryByText("Capture Idea")).not.toBeInTheDocument();
    });
  });
});
