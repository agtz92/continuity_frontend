"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistantLauncher } from "./useAssistantLauncher";

/**
 * Desktop-only floating quick-access to Loop (the AI assistant), bottom-right.
 * The mobile web reaches Loop through the speed-dial FAB; wide layouts have no
 * FAB (create lives in the page headers), so this fills the gap. `hidden
 * md:flex` keeps it off mobile; z-30 matches the FAB (below tab bar/modals).
 */
export function AssistantFab() {
  const t = useTranslations("assistant");
  const openAssistant = useAssistantLauncher();

  return (
    <button
      type="button"
      onClick={() => openAssistant()}
      aria-label={t("buttonLabel")}
      title={t("openTooltip")}
      className="hidden md:flex fixed bottom-6 right-6 z-30 items-center gap-2 rounded-full bg-accent text-bg pl-4 pr-5 h-12 shadow-lg hover:opacity-90 active:scale-95 transition-transform"
    >
      <Sparkles size={18} />
      <span className="text-sm font-semibold">{t("buttonLabel")}</span>
    </button>
  );
}
