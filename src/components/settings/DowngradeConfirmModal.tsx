"use client";

import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { DOWNGRADE_TO_PLAN } from "@/lib/graphql";
import { useBillingErrorMessage } from "@/lib/billingErrors";
import { toast } from "@/lib/toast";

export function DowngradeConfirmModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("settings.billing.downgradeConfirm");
  const billingError = useBillingErrorMessage();

  const [doDowngrade, { loading }] = useMutation(DOWNGRADE_TO_PLAN, {
    onCompleted: () => {
      toast.success(t("success"));
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(billingError(e)),
  });

  if (!open) return null;

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
          <h2 className="text-lg font-semibold text-text">{t("title")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text"
            aria-label={t("back")}
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-5 leading-relaxed">
          {t("body")}
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              doDowngrade({
                variables: { plan: "PRO", period: "MONTHLY" },
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
