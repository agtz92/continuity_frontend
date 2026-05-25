"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  APPLY_RETENTION_OFFER,
  CANCEL_SUBSCRIPTION,
  DOWNGRADE_TO_PLAN,
} from "@/lib/graphql";
import { useBillingErrorMessage } from "@/lib/billingErrors";
import { toast } from "@/lib/toast";

type Reason =
  | "too_expensive"
  | "not_used"
  | "missing_features"
  | "switching"
  | "trial_only"
  | "other";

type Step =
  | "reason"
  | "offer"
  | "downgrade"
  | "confirm"
  | "done_cancelled"
  | "done_offer"
  | "done_downgrade";

const REASON_KEY: Record<Reason, string> = {
  too_expensive: "reasonTooExpensive",
  not_used: "reasonNotUsed",
  missing_features: "reasonMissingFeatures",
  switching: "reasonSwitching",
  trial_only: "reasonTrialOnly",
  other: "reasonOther",
};

const OFFER_TITLE_KEY: Record<Reason, string> = {
  too_expensive: "stepOfferTitleTooExpensive",
  not_used: "stepOfferTitleNotUsed",
  missing_features: "stepOfferTitleMissingFeatures",
  switching: "stepOfferTitleSwitching",
  trial_only: "stepOfferTitleTrialOnly",
  other: "stepOfferTitleOther",
};

const OFFER_BODY_KEY: Record<Reason, string> = {
  too_expensive: "stepOfferBodyTooExpensive",
  not_used: "stepOfferBodyNotUsed",
  missing_features: "stepOfferBodyMissingFeatures",
  switching: "stepOfferBodySwitching",
  trial_only: "stepOfferBodyTrialOnly",
  other: "stepOfferBodyOther",
};

export function RetentionFlow({
  open,
  onClose,
  plan,
  hadRetentionOffer,
  renewsAt,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  plan: "pro" | "studio";
  hadRetentionOffer: boolean;
  renewsAt: string | null;
  /** Called when state changed (cancel scheduled, offer applied, downgrade done) so parent refetches. */
  onChange: () => void;
}) {
  const t = useTranslations("settings.billing.retention");
  const billingError = useBillingErrorMessage();
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<Reason | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const [applyOffer, { loading: applyingOffer }] = useMutation(
    APPLY_RETENTION_OFFER,
    {
      onCompleted: () => {
        setStep("done_offer");
        onChange();
      },
      onError: (e) => {
        const ext = e.graphQLErrors?.[0]?.extensions;
        if (ext?.code === "RETENTION_ALREADY_USED") {
          toast.info(billingError(e));
          // Skip to confirm if the user somehow gets here despite the gating
          setStep(plan === "studio" ? "downgrade" : "confirm");
        } else {
          toast.error(billingError(e));
        }
      },
    }
  );

  const [doCancel, { loading: cancelling }] = useMutation(CANCEL_SUBSCRIPTION, {
    onCompleted: () => {
      setStep("done_cancelled");
      onChange();
    },
    onError: (e) => toast.error(billingError(e)),
  });

  const [doDowngrade, { loading: downgrading }] = useMutation(
    DOWNGRADE_TO_PLAN,
    {
      onCompleted: () => {
        setStep("done_downgrade");
        onChange();
      },
      onError: (e) => toast.error(billingError(e)),
    }
  );

  const reset = () => {
    setStep("reason");
    setReason(null);
    setFeedbackText("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleReasonContinue = () => {
    if (!reason) return;
    if (hadRetentionOffer) {
      // No second offer — go straight to downgrade (Studio) or confirm (Pro)
      setStep(plan === "studio" ? "downgrade" : "confirm");
    } else {
      setStep("offer");
    }
  };

  if (!open) return null;

  const allReasons: Reason[] = [
    "too_expensive",
    "not_used",
    "missing_features",
    "switching",
    "trial_only",
    "other",
  ];
  const showFeedback =
    reason === "missing_features" || reason === "other";

  const renewsAtFormatted = renewsAt
    ? new Date(renewsAt).toLocaleDateString()
    : "—";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">{t("title")}</h2>
          <button
            type="button"
            onClick={close}
            className="text-text-muted hover:text-text"
            aria-label={t("close")}
          >
            <X size={18} />
          </button>
        </div>

        {step === "reason" && (
          <div>
            <p className="text-sm text-text-muted mb-4">
              {t("stepReasonSubtitle")}
            </p>
            <h3 className="text-base font-medium text-text mb-3">
              {t("stepReasonTitle")}
            </h3>
            <div className="space-y-2 mb-4">
              {allReasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${
                    reason === r
                      ? "border-accent bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                      : "border-border hover:bg-bg/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-accent"
                  />
                  <span className="text-sm text-text">
                    {t(REASON_KEY[r])}
                  </span>
                </label>
              ))}
            </div>
            {showFeedback && (
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t("feedbackPlaceholder")}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg/40 text-text placeholder:text-text-muted resize-none mb-4 focus:outline-none focus:border-accent"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="px-3 py-1.5 text-sm rounded-lg border border-border text-text hover:bg-bg"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={!reason}
                onClick={handleReasonContinue}
                className="px-3 py-1.5 text-sm rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-40"
              >
                {t("continue")}
              </button>
            </div>
          </div>
        )}

        {step === "offer" && reason && (
          <div>
            <h3 className="text-base font-semibold text-text mb-2">
              {t(OFFER_TITLE_KEY[reason])}
            </h3>
            <p className="text-sm text-text-muted mb-5 leading-relaxed">
              {t(OFFER_BODY_KEY[reason])}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={applyingOffer}
                onClick={() =>
                  applyOffer({
                    variables: {
                      reason: reason.toUpperCase(),
                      feedbackText: feedbackText || null,
                    },
                  })
                }
                className="w-full px-4 py-2 text-sm rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                {t("acceptOffer")}
              </button>
              <button
                type="button"
                onClick={() =>
                  setStep(plan === "studio" ? "downgrade" : "confirm")
                }
                className="w-full px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-bg"
              >
                {t("declineOffer")}
              </button>
            </div>
            <div className="mt-4 flex justify-start">
              <button
                type="button"
                onClick={() => setStep("reason")}
                className="text-xs text-text-muted hover:text-text"
              >
                ← {t("back")}
              </button>
            </div>
          </div>
        )}

        {step === "downgrade" && (
          <div>
            <h3 className="text-base font-semibold text-text mb-2">
              {t("stepDowngradeTitle")}
            </h3>
            <p className="text-sm text-text-muted mb-5 leading-relaxed">
              {t("stepDowngradeBody", { price: "$9 USD" })}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={downgrading}
                onClick={() =>
                  doDowngrade({
                    variables: { plan: "PRO", period: "MONTHLY" },
                  })
                }
                className="w-full px-4 py-2 text-sm rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                {t("downgradeToPro")}
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="w-full px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-bg"
              >
                {t("declineOffer")}
              </button>
            </div>
            <div className="mt-4 flex justify-start">
              <button
                type="button"
                onClick={() =>
                  hadRetentionOffer ? setStep("reason") : setStep("offer")
                }
                className="text-xs text-text-muted hover:text-text"
              >
                ← {t("back")}
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && reason && (
          <div>
            <h3 className="text-base font-semibold text-text mb-2">
              {t("stepConfirmTitle")}
            </h3>
            <p className="text-sm text-text-muted mb-5 leading-relaxed">
              {t("stepConfirmBody", { date: renewsAtFormatted })}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() =>
                  doCancel({
                    variables: {
                      reason: reason.toUpperCase(),
                      feedbackText: feedbackText || null,
                    },
                  })
                }
                className="w-full px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                {t("confirmCancel")}
              </button>
              <button
                type="button"
                onClick={() =>
                  plan === "studio" ? setStep("downgrade") : setStep("reason")
                }
                className="w-full px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-bg"
              >
                {t("back")}
              </button>
            </div>
          </div>
        )}

        {step === "done_cancelled" && (
          <DoneStep
            title={t("stepDoneTitleCancelled", { date: renewsAtFormatted })}
            body={t("stepDoneBodyCancelled")}
            close={close}
            closeLabel={t("close")}
          />
        )}
        {step === "done_offer" && (
          <DoneStep
            title={t("stepDoneTitleOffer")}
            body={t("stepDoneBodyOffer")}
            close={close}
            closeLabel={t("close")}
          />
        )}
        {step === "done_downgrade" && (
          <DoneStep
            title={t("stepDoneTitleDowngrade")}
            body={t("stepDoneBodyDowngrade")}
            close={close}
            closeLabel={t("close")}
          />
        )}
      </div>
    </div>
  );
}

function DoneStep({
  title,
  body,
  close,
  closeLabel,
}: {
  title: string;
  body: string;
  close: () => void;
  closeLabel: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-muted mb-5 leading-relaxed">{body}</p>
      <button
        type="button"
        onClick={close}
        className="w-full px-4 py-2 text-sm rounded-lg bg-accent text-white font-medium hover:opacity-90"
      >
        {closeLabel}
      </button>
    </div>
  );
}
