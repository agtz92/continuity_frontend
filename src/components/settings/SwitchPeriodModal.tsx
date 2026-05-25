"use client";

import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { DOWNGRADE_TO_PLAN } from "@/lib/graphql";
import { useBillingErrorMessage } from "@/lib/billingErrors";
import { toast } from "@/lib/toast";

type Plan = "pro" | "studio";
type Period = "monthly" | "annual";

// Prices in USD per month, mirrored from the i18n catalog.
// Single source for display only — the actual price charged is the Stripe
// price configured by env var; this is just to show the user the diff in
// the confirmation modal.
const PRICE_PER_MONTH: Record<Plan, Record<Period, string>> = {
  pro: { monthly: "9", annual: "7" },
  studio: { monthly: "24", annual: "19" },
};

export function SwitchPeriodModal({
  open,
  onClose,
  onSuccess,
  plan,
  currentPeriod,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan: Plan;
  currentPeriod: Period;
}) {
  const t = useTranslations("settings.billing.billingPeriod");
  const tPlan = useTranslations("settings.billing");
  const billingError = useBillingErrorMessage();

  const targetPeriod: Period =
    currentPeriod === "monthly" ? "annual" : "monthly";

  const [doSwitch, { loading }] = useMutation(DOWNGRADE_TO_PLAN, {
    onCompleted: () => {
      toast.success(
        targetPeriod === "annual" ? t("successAnnual") : t("successMonthly")
      );
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(billingError(e)),
  });

  if (!open) return null;

  const planLabel = plan === "studio" ? tPlan("studio") : tPlan("pro");
  const currentPrice = PRICE_PER_MONTH[plan][currentPeriod];
  const newPrice = PRICE_PER_MONTH[plan][targetPeriod];

  const title =
    targetPeriod === "annual" ? t("confirmTitleAnnual") : t("confirmTitleMonthly");
  const body =
    targetPeriod === "annual"
      ? t("confirmBodyToAnnual", {
          plan: planLabel,
          currentPrice,
          newPrice,
        })
      : t("confirmBodyToMonthly", {
          plan: planLabel,
          currentPrice,
          newPrice,
        });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text"
            aria-label={t("back")}
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-5 leading-relaxed">{body}</p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              doSwitch({
                variables: {
                  plan: plan.toUpperCase(),
                  period: targetPeriod.toUpperCase(),
                },
              })
            }
            className="w-full px-4 py-2 text-sm rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {t("confirm")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-bg"
          >
            {t("back")}
          </button>
        </div>
      </div>
    </div>
  );
}
