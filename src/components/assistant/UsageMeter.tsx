"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { UsageSnapshot } from "@/lib/assistantApi";

export function UsageMeter({ usage }: { usage: UsageSnapshot | null }) {
  const t = useTranslations("assistant.usage");
  if (!usage) return null;

  const cap = usage.daily_message_cap;
  const used = usage.messages_sent_today;
  const ratio = cap == null ? 0 : Math.min(1, used / Math.max(1, cap));
  const nearLimit = cap != null && ratio >= 0.8;

  return (
    <div className="px-3 py-2 border-b border-border/80 bg-bg/60">
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span>
          {cap == null
            ? t("uncapped")
            : t("usedOf", { used, cap })}
        </span>
        {nearLimit && (
          <Link
            href="/settings/billing"
            className="text-accent hover:text-accent font-medium"
          >
            {t("upgrade")}
          </Link>
        )}
      </div>
      {cap != null && (
        <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full transition-all ${
              nearLimit ? "bg-amber-400" : "bg-accent"
            }`}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
