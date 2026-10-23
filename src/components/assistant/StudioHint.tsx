"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import type { StudioHint as StudioHintData } from "@/lib/assistantApi";

/**
 * Under a `canned` answer: what Studio would do with these same rows,
 * phrased as something the user would say.
 *
 * The phrase and its label come from the server (`canned.studio_hint`), so
 * a new hint ships without a release. Only the link and "hide" live here.
 * Quiet on purpose: a rule on the left and muted ink, the same weight as a
 * footnote. It is a next step, not a banner.
 */
export function StudioHint({
  hint,
  onDismiss,
}: {
  hint: StudioHintData;
  onDismiss: () => void;
}) {
  const t = useTranslations("assistant.hint");
  return (
    <div className="ml-9 border-l-2 border-accent-a35 py-1 pl-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-accent">
        <Sparkles size={11} aria-hidden />
        {hint.label}
      </div>
      <p className="mt-0.5 text-[13px] leading-snug text-text-muted">
        {hint.text}
      </p>
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        <Link href="/settings/billing" className="text-accent hover:underline">
          {t("cta")}
        </Link>
        <span className="text-text-3" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-text-3 transition-colors hover:text-text-muted"
        >
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
