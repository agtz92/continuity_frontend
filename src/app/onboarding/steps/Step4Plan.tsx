"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  COMPLETE_ONBOARDING,
  CREATE_CHECKOUT_SESSION,
  ONBOARDING_STATE_QUERY,
} from "@/lib/graphql";

type PlanKey = "free" | "pro" | "studio";

const SELECTABLE_PLANS: PlanKey[] = ["free", "pro", "studio"];

function planLabelKey(plan: string): string {
  // settings.billing.* has the canonical localized plan names.
  const slug = (plan || "free").toLowerCase();
  if (slug === "admin") return "admin";
  return slug;
}

export function Step4Plan({
  name,
  plan,
  isBillingExempt,
  replay,
  onBack,
  onFinish,
  busy,
}: {
  name: string;
  plan: string;
  isBillingExempt: boolean;
  replay: boolean;
  onBack: () => void;
  onFinish: (opts?: { skipTour?: boolean; forceTour?: boolean }) => Promise<void> | void;
  busy: boolean;
}) {
  const t = useTranslations("onboarding");
  const tBilling = useTranslations("settings.billing");

  const [selected, setSelected] = useState<PlanKey>("free");
  const [checkingOut, setCheckingOut] = useState(false);

  const [completeOnboarding] = useMutation(COMPLETE_ONBOARDING, {
    refetchQueries: [{ query: ONBOARDING_STATE_QUERY }],
  });
  const [createCheckout] = useMutation(CREATE_CHECKOUT_SESSION);

  // ── Beta / exempt branch ─────────────────────────────────────────────
  if (isBillingExempt) {
    const planLabel = tBilling(planLabelKey(plan));
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-text">
            {t("step4Beta.heading", { name })}
          </h1>
        </div>
        <div className="space-y-4 text-text">
          <p>{t("step4Beta.body", { plan: planLabel })}</p>
          <p>{t("step4Beta.body2")}</p>
          <p className="text-text-muted italic">{t("step4Beta.signoff")}</p>
        </div>
        <div className="flex items-center justify-between mt-auto pt-4">
          {!replay ? (
            <button
              type="button"
              onClick={onBack}
              disabled={busy}
              className="text-sm text-text-muted hover:text-text disabled:opacity-50"
            >
              {t("back")}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => onFinish()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {replay ? t("replay.finishButton") : t("step4Beta.primary")}
          </button>
        </div>
      </div>
    );
  }

  // ── Replay branch (non-beta): informational, no plan selection ───────
  if (replay) {
    const planLabel = tBilling(planLabelKey(plan));
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-text">
            {t("replay.planHeading")}
          </h1>
          <p className="text-text-muted text-sm mt-2">
            {t("replay.planInfo", { plan: planLabel })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5 flex items-center justify-between gap-4">
          <div className="font-display text-2xl text-text">{planLabel}</div>
          <Link
            href="/settings/billing"
            className="inline-flex items-center text-sm text-accent hover:opacity-80 shrink-0"
          >
            {t("replay.planChangeCta")}
          </Link>
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
            <button
              type="button"
              onClick={() => onFinish({ forceTour: true })}
              disabled={busy}
              className="text-sm text-text-muted hover:text-text disabled:opacity-50"
            >
              {t("replay.replayTourButton")}
            </button>
            <button
              type="button"
              onClick={() => onFinish({ skipTour: true })}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {t("replay.finishButton")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── First-time branch: pick a plan (free preselected) ────────────────
  const handleContinue = async () => {
    if (selected === "free") {
      await onFinish();
      return;
    }
    // Paid tier: mark onboarding done first so the Stripe return doesn't
    // bounce the user back here, then redirect to Stripe Checkout.
    setCheckingOut(true);
    try {
      await completeOnboarding({ variables: { mode: "finished" } });
      const planEnum = selected.toUpperCase();
      const result = await createCheckout({
        variables: { plan: planEnum, period: "MONTHLY" },
      });
      const url = result.data?.createCheckoutSession?.url;
      if (url) {
        window.location.assign(url);
      } else {
        // No URL returned — fall through to the dashboard so the user
        // can retry from /settings/billing.
        await onFinish({ skipTour: true });
      }
    } catch {
      setCheckingOut(false);
      // Billing config errors etc. — let the user keep going on Free so
      // they're not stuck on the onboarding screen.
      await onFinish();
    }
  };

  const total = checkingOut || busy;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-text">
          {t("step4Plan.heading")}
        </h1>
        <p className="text-text-muted text-sm mt-2">{t("step4Plan.sub")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SELECTABLE_PLANS.map((p) => {
          const isSelected = selected === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setSelected(p)}
              disabled={total}
              className={`text-left rounded-xl border p-4 transition-colors disabled:opacity-50 ${
                isSelected
                  ? "border-accent bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                  : "border-border bg-surface/30 hover:bg-surface/60"
              }`}
              aria-pressed={isSelected}
            >
              <div className="font-display text-lg text-text mb-1">
                {tBilling(p)}
              </div>
              <div className="text-xs text-text-muted">
                {t(`step4Plan.cards.${p}`)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={total}
          className="text-sm text-text-muted hover:text-text disabled:opacity-50"
        >
          {t("back")}
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onFinish()}
            disabled={total}
            className="text-sm text-text-muted hover:text-text disabled:opacity-50"
          >
            {t("step4Plan.decideLater")}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={total}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {total && <Loader2 size={14} className="animate-spin" />}
            {t("step4Plan.primary")}
          </button>
        </div>
      </div>
    </div>
  );
}
