"use client";

import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistantLauncher } from "@/components/assistant/useAssistantLauncher";

/**
 * Floating Action Button → speed-dial (mobile-web only; `md:hidden`).
 *
 * Tapping it reveals the screen's primary create action plus a built-in
 * "Open Loop" entry (the AI assistant), mirroring the native app so the
 * assistant is reachable from the + on every list screen. A scrim closes it;
 * the + rotates 45° (reads as ×) when open. On desktop the create action lives
 * in the page headers and Loop has its own quick-access button (AssistantFab),
 * so this stays mobile-only.
 *
 * Positioned 80px from the viewport bottom so it clears the BottomTabBar
 * (h-16 + safe-area-inset-bottom). z-30 keeps it above content but below the
 * BottomTabBar (z-40) and modal layers (z-50).
 */
export function FAB({
  icon,
  onClick,
  label,
  className = "",
}: {
  icon: ReactNode;
  onClick: () => void;
  /** Accessible label + speed-dial label for the primary action. */
  label: string;
  className?: string;
}) {
  const t = useTranslations("assistant");
  const openAssistant = useAssistantLauncher();
  const [open, setOpen] = useState(false);

  const runPrimary = () => {
    setOpen(false);
    onClick();
  };
  const openLoop = () => {
    setOpen(false);
    openAssistant();
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-black/30"
        />
      )}

      <div
        className="md:hidden fixed right-4 z-30 flex flex-col items-end gap-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
      >
        {open && (
          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={openLoop}
              aria-label={t("buttonLabel")}
              className="flex items-center gap-2 active:scale-95 transition-transform"
            >
              <span className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text shadow">
                {t("buttonLabel")}
              </span>
              <span className="w-12 h-12 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg">
                <Sparkles size={20} />
              </span>
            </button>

            <button
              type="button"
              onClick={runPrimary}
              aria-label={label}
              className="flex items-center gap-2 active:scale-95 transition-transform"
            >
              <span className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text shadow">
                {label}
              </span>
              <span
                className={`w-12 h-12 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg ${className}`}
              >
                {icon}
              </span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={label}
          aria-expanded={open}
          className={`w-14 h-14 rounded-full bg-accent text-bg shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform ${className}`}
        >
          <span className={`transition-transform ${open ? "rotate-45" : ""}`}>
            {icon}
          </span>
        </button>
      </div>
    </>
  );
}
