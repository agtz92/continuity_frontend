"use client";

import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { ComingSoon } from "@/components/settings/ComingSoon";

export default function BillingSettingsPage() {
  const t = useTranslations("settings.billing");
  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-5">
        <div className="text-xs text-zinc-500 mb-1">{t("currentPlan")}</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-zinc-100 font-medium">{t("free")}</div>
            <div className="text-zinc-500 text-xs mt-0.5">{t("freeBlurb")}</div>
          </div>
          <button
            disabled
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-500 cursor-not-allowed"
          >
            {t("upgrade")}
          </button>
        </div>
      </div>
      <ComingSoon icon={CreditCard} message={t("comingSoonBody")} />
    </SettingsShell>
  );
}
