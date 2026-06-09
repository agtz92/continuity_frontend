"use client";

import { useTranslations } from "next-intl";
import { Loader2, Settings2 } from "lucide-react";

/**
 * Step 5 — the closing onboarding beat: introduce the Today customize editor
 * and hand the user straight into it.
 *
 * Branches:
 *  - first-time: primary opens the editor (`customize`), secondary ("Maybe
 *    later") finishes normally so the dashboard tour fires.
 *  - replay: primary still opens the editor, secondary is "Done", and the
 *    "Watch the dashboard tour again" link (moved here from the plan step)
 *    re-arms the tour.
 *
 * The actual completion + navigation lives in OnboardingFlow.handleFinish;
 * this component only signals intent via the `onFinish` options.
 */
export function Step5Customize({
  replay,
  busy,
  onBack,
  onFinish,
}: {
  replay: boolean;
  busy: boolean;
  onBack: () => void;
  onFinish: (opts?: {
    skipTour?: boolean;
    forceTour?: boolean;
    customize?: boolean;
  }) => Promise<void> | void;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-text">
          {t("step5.heading")}
        </h1>
        <p className="text-text-muted text-sm mt-2">{t("step5.sub")}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface/50 p-5 flex items-center gap-4">
        <div className="shrink-0 h-10 w-10 rounded-lg border border-border bg-bg grid place-items-center text-text-muted">
          <Settings2 size={18} aria-hidden />
        </div>
        <p className="text-sm text-text-muted">{t("step5.hint")}</p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="text-sm text-text-muted hover:text-text disabled:opacity-50"
        >
          {t("back")}
        </button>
        <div className="flex items-center gap-3">
          {replay && (
            <button
              type="button"
              onClick={() => onFinish({ forceTour: true })}
              disabled={busy}
              className="text-sm text-text-muted hover:text-text disabled:opacity-50"
            >
              {t("replay.replayTourButton")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onFinish(replay ? { skipTour: true } : undefined)}
            disabled={busy}
            className="text-sm text-text-muted hover:text-text disabled:opacity-50"
          >
            {replay ? t("replay.finishButton") : t("step5.later")}
          </button>
          <button
            type="button"
            onClick={() => onFinish({ customize: true })}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {t("step5.primary")}
          </button>
        </div>
      </div>
    </div>
  );
}
