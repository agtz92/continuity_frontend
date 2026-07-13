import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "./Toaster";
import { toast } from "@/lib/toast";
import enMessages from "../../../messages/en.json";

// `next-intl` is stubbed globally in vitest.setup.ts: `useTranslations()`
// resolves dotted keys against messages/en.json. So the Toaster renders the
// real English copy for key-based toasts without a provider.

describe("<Toaster />", () => {
  it("renders nothing when there are no toasts", () => {
    const { container } = render(<Toaster />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a raw-message error toast pushed via the bus", () => {
    render(<Toaster />);
    act(() => {
      toast.error("Project not found");
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Project not found");
  });

  it("resolves a message key to its localized copy", () => {
    render(<Toaster />);
    act(() => {
      toast.errorKey("errors.connectionLost");
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      enMessages.errors.connectionLost
    );
  });

  it("renders success toasts as status (not alert)", () => {
    render(<Toaster />);
    act(() => {
      toast.success("Saved");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("dismisses a toast when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    act(() => {
      toast.error("Goodbye");
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stacks multiple toasts in order", () => {
    render(<Toaster />);
    act(() => {
      toast.error("first");
      toast.error("second");
    });
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveTextContent("first");
    expect(alerts[1]).toHaveTextContent("second");
  });
});
