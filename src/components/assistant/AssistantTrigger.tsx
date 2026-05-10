"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export function AssistantTrigger({ onClick }: { onClick: () => void }) {
  const t = useTranslations("assistant");
  return (
    <button
      type="button"
      onClick={onClick}
      title={t("openTooltip")}
      aria-label={t("openTooltip")}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
    >
      <Sparkles size={12} />
      <span className="hidden sm:inline">{t("buttonLabel")}</span>
    </button>
  );
}
