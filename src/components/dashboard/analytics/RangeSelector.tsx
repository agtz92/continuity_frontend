"use client";

import { useTranslations } from "next-intl";
import type { AnalyticsRange } from "@/lib/types";

const RANGES: { value: AnalyticsRange; key: "7d" | "30d" | "90d" | "1y" | "all" }[] = [
  { value: "LAST_7_DAYS", key: "7d" },
  { value: "LAST_30_DAYS", key: "30d" },
  { value: "LAST_90_DAYS", key: "90d" },
  { value: "LAST_365_DAYS", key: "1y" },
  { value: "ALL_TIME", key: "all" },
];

export function RangeSelector({
  range,
  onChange,
}: {
  range: AnalyticsRange;
  onChange: (r: AnalyticsRange) => void;
}) {
  const t = useTranslations("analytics.range");
  return (
    <div className="inline-flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            range === r.value
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {t(r.key)}
        </button>
      ))}
    </div>
  );
}
