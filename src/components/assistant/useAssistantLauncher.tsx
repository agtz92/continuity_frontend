"use client";

import { createContext, useContext, type ReactNode } from "react";

const AssistantLauncherContext = createContext<(() => void) | null>(null);

/**
 * Exposes a single `openAssistant()` so the quick-access entry points — the
 * mobile-web speed-dial FAB and the desktop AssistantFab — can open the Loop
 * panel without prop-drilling through every view. Provided by Dashboard, which
 * owns the panel's open state.
 */
export function AssistantLauncherProvider({
  open,
  children,
}: {
  open: () => void;
  children: ReactNode;
}) {
  return (
    <AssistantLauncherContext.Provider value={open}>
      {children}
    </AssistantLauncherContext.Provider>
  );
}

export function useAssistantLauncher(): () => void {
  return useContext(AssistantLauncherContext) ?? (() => {});
}
