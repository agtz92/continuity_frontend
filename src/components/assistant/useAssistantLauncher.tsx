"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Opens the Loop panel, optionally pre-filling the chat input. */
type OpenAssistant = (initialPrompt?: string) => void;

const AssistantLauncherContext = createContext<OpenAssistant | null>(null);

/**
 * Exposes a single `openAssistant(initialPrompt?)` so the quick-access entry
 * points — the mobile-web speed-dial FAB and the desktop AssistantFab — can open
 * the Loop panel without prop-drilling through every view. Callers may pass an
 * optional prompt that the panel pre-fills into the chat input (the user presses
 * enter). Provided by Dashboard, which owns the panel's open state.
 */
export function AssistantLauncherProvider({
  open,
  children,
}: {
  open: OpenAssistant;
  children: ReactNode;
}) {
  return (
    <AssistantLauncherContext.Provider value={open}>
      {children}
    </AssistantLauncherContext.Provider>
  );
}

export function useAssistantLauncher(): OpenAssistant {
  return useContext(AssistantLauncherContext) ?? (() => {});
}
