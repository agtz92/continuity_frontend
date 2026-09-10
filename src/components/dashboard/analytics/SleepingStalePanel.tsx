"use client";

import { MoonStar, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SleepingProjectRow, StaleIdeaRow } from "@/lib/types";
import { PanelCard } from "./PanelCard";

const BUCKET_TONE: Record<SleepingProjectRow["bucket"], string> = {
  "7-14": "bg-line-06 text-text-3 border-line-22",
  "15-30": "bg-line-06 text-text-3 border-line-22",
  "30+": "bg-line-06 text-text-3 border-line-22",
};

export function SleepingStalePanel({
  sleeping,
  stale,
}: {
  sleeping: SleepingProjectRow[];
  stale: StaleIdeaRow[];
}) {
  const tSleep = useTranslations("analytics.sleeping");
  const tStale = useTranslations("analytics.stale");
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <PanelCard
        title={tSleep("title")}
        icon={<MoonStar size={16} className="text-text-3" />}
        subtitle={tSleep("subtitle")}
      >
        {sleeping.length === 0 ? (
          <div className="text-sm text-text-muted py-4">{tSleep("empty")}</div>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {sleeping.map((s) => (
              <li
                key={s.projectId}
                className="flex items-center justify-between gap-3 bg-well border border-border rounded-lg px-3 py-2"
              >
                <div className="text-sm text-text truncate">{s.name}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${BUCKET_TONE[s.bucket]}`}
                  >
                    {s.bucket}d
                  </span>
                  <span className="text-xs text-text-muted tabular-nums">
                    {s.daysIdle}d
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard
        title={tStale("title")}
        icon={<Lightbulb size={16} className="text-text-3" />}
        subtitle={tStale("subtitle")}
      >
        {stale.length === 0 ? (
          <div className="text-sm text-text-muted py-4">{tStale("empty")}</div>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {stale.map((s) => (
              <li
                key={s.ideaId}
                className="flex items-center justify-between gap-3 bg-well border border-border rounded-lg px-3 py-2"
              >
                <div className="text-sm text-text truncate">{s.title}</div>
                <span className="text-xs text-text-muted tabular-nums shrink-0">
                  {s.daysOld}d
                </span>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}
