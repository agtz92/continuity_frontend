"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WeekdayBucket } from "@/lib/types";
import { PanelCard } from "./PanelCard";

const KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function WeekdayHeatmap({ heatmap }: { heatmap: WeekdayBucket[] }) {
  const t = useTranslations("analytics.weekday");
  const max = Math.max(1, ...heatmap.map((b) => b.count));
  const lookup = new Map(heatmap.map((b) => [b.weekday, b.count] as const));

  return (
    <PanelCard
      title={t("title")}
      icon={<CalendarDays size={16} className="text-purple-400" />}
    >
      <div className="grid grid-cols-7 gap-2">
        {KEYS.map((key, i) => {
          const wd = i + 1; // ISO 1=Mon..7=Sun
          const count = lookup.get(wd) ?? 0;
          const intensity = count / max;
          const opacity = count === 0 ? 0.08 : 0.25 + intensity * 0.75;
          return (
            <div key={wd} className="flex flex-col items-center gap-1.5">
              <div
                className="w-full aspect-square rounded-md flex items-center justify-center"
                style={{ backgroundColor: `rgba(52, 211, 153, ${opacity})` }}
              >
                <span className="text-xs font-semibold text-text">
                  {count}
                </span>
              </div>
              <div className="text-[10px] text-text-muted">{t(`labels.${key}`)}</div>
            </div>
          );
        })}
      </div>
    </PanelCard>
  );
}
