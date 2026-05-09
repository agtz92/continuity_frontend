"use client";

import type { AnalyticsRange } from "@/lib/types";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "LAST_7_DAYS", label: "7d" },
  { value: "LAST_30_DAYS", label: "30d" },
  { value: "LAST_90_DAYS", label: "90d" },
  { value: "LAST_365_DAYS", label: "1a" },
  { value: "ALL_TIME", label: "Todo" },
];

export function RangeSelector({
  range,
  onChange,
}: {
  range: AnalyticsRange;
  onChange: (r: AnalyticsRange) => void;
}) {
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
          {r.label}
        </button>
      ))}
    </div>
  );
}
