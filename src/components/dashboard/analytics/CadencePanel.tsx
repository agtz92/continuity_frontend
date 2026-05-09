"use client";

import { Flame } from "lucide-react";
import type { CadenceStats } from "@/lib/types";
import { PanelCard } from "./PanelCard";

export function CadencePanel({ cadence }: { cadence: CadenceStats }) {
  const tiles = [
    { label: "Current streak", value: cadence.currentStreak, suffix: "d" },
    { label: "Best streak", value: cadence.longestStreak, suffix: "d" },
    { label: "Active days", value: cadence.activeDaysInRange, suffix: "" },
    { label: "Events", value: cadence.totalActivityEvents, suffix: "" },
  ];

  return (
    <PanelCard
      title="Cadence"
      icon={<Flame size={16} className="text-amber-400" />}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3"
          >
            <div className="text-2xl font-semibold text-zinc-100">
              {t.value}
              <span className="text-sm text-zinc-500 ml-0.5">{t.suffix}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">{t.label}</div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
