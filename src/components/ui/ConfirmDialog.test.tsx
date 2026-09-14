import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";
import { confirmDialog } from "@/lib/confirm";
import enMessages from "../../../messages/en.json";

// `next-intl` is stubbed globally in vitest.setup.ts: `useTranslations()`
// resolves dotted keys against messages/en.json, so the dialog renders the
// real English copy without a provider.

const project = enMessages.modals.project;

describe("<ConfirmDialog />", () => {
  it("renders nothing until something asks", () => {
    const { container } = render(<ConfirmDialog />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the localized question and body, in-app (no window.confirm)", async () => {
    render(<ConfirmDialog />);
    let answer: Promise<boolean>;
    act(() => {
      answer = confirmDialog({
        titleKey: "modals.project.deleteConfirm",
        bodyKey: "modals.project.deleteConfirmBody",
      });
    });
    expect(
      await screen.findByRole("heading", { name: project.deleteConfirm })
    ).toBeInTheDocument();
    expect(screen.getByText(project.deleteConfirmBody)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: enMessages.common.cancel })
    );
    await expect(answer!).resolves.toBe(false);
  });

  it("resolves true when the destructive button is pressed", async () => {
    render(<ConfirmDialog />);
    let answer: Promise<boolean>;
    act(() => {
      answer = confirmDialog({ titleKey: "modals.project.deleteConfirm" });
    });
    await userEvent.click(
      await screen.findByRole("button", { name: enMessages.common.delete })
    );
    await expect(answer!).resolves.toBe(true);
    expect(
      screen.queryByRole("heading", { name: project.deleteConfirm })
    ).not.toBeInTheDocument();
  });

  it("cancels on Escape", async () => {
    render(<ConfirmDialog />);
    let answer: Promise<boolean>;
    act(() => {
      answer = confirmDialog({ titleKey: "modals.project.deleteConfirm" });
    });
    await screen.findByRole("heading", { name: project.deleteConfirm });
    await userEvent.keyboard("{Escape}");
    await expect(answer!).resolves.toBe(false);
  });
});
