"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { ComingSoon } from "@/components/settings/ComingSoon";
import { PlanBadge } from "@/components/assistant/PlanBadge";
import { getUsage, type UsageSnapshot } from "@/lib/assistantApi";

export default function BillingSettingsPage() {
  const t = useTranslations("settings.billing");
  const tAssistant = useTranslations("assistant.usage");
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  useEffect(() => {
    getUsage()
      .then(setUsage)
      .catch(() => {
        /* swallow — assistant might be offline */
      });
  }, []);

  const plan = usage?.plan ?? "free";
  const cap = usage?.daily_message_cap ?? null;
  const used = usage?.messages_sent_today ?? 0;
  const monthlyCap = usage?.monthly_token_cap ?? null;
  const monthlyUsed = usage?.tokens_used_month ?? 0;

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-5">
        <div className="text-xs text-zinc-500 mb-1">{t("currentPlan")}</div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-zinc-100 font-medium">
              {plan === "pro" ? t("pro") : plan === "admin" ? t("admin") : t("free")}
            </div>
            <PlanBadge plan={plan} />
          </div>
          <button
            disabled
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-500 cursor-not-allowed"
          >
            {t("upgrade")}
          </button>
        </div>
        <div className="text-xs text-zinc-500 mb-3">
          {plan === "free" ? t("freeBlurb") : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UsageRow
            label={tAssistant("dailyMessages")}
            value={cap == null ? `${used}` : `${used} / ${cap}`}
          />
          <UsageRow
            label={tAssistant("monthlyTokens")}
            value={
              monthlyCap == null
                ? formatNumber(monthlyUsed)
                : `${formatNumber(monthlyUsed)} / ${formatNumber(monthlyCap)}`
            }
          />
        </div>
      </div>
      <ComingSoon icon={CreditCard} message={t("comingSoonBody")} />
    </SettingsShell>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="text-sm text-zinc-200 font-medium mt-0.5">{value}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
