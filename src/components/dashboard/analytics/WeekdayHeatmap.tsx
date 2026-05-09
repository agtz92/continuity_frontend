"use client";

import { CalendarDays } from "lucide-react";
import type { WeekdayBucket } from "@/lib/types";
import { PanelCard } from "./PanelCard";

const LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function WeekdayHeatmap({ heatmap }: { heatmap: WeekdayBucket[] }) {
  const max = Math.max(1, ...heatmap.map((b) => b.count));
  const lookup = new Map(heatmap.map((b) => [b.weekday, b.count] as const));

  return (
    <PanelCard
      title="Por día de la semana"
      icon={<CalendarDays size={16} className="text-purple-400" />}
    >
      <div className="grid grid-cols-7 gap-2">
        {LABELS.map((label, i) => {
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
                <span className="text-xs font-semibold text-zinc-100">
                  {count}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">{label}</div>
            </div>
          );
        })}
      </div>
    </PanelCard>
  );
}
