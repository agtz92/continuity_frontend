"use client";

import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CadenceStats } from "@/lib/types";
import { PanelCard } from "./PanelCard";

export function CadencePanel({ cadence }: { cadence: CadenceStats }) {
  const t = useTranslations("analytics.cadence");
  const tiles = [
    { label: t("currentStreak"), value: cadence.currentStreak, suffix: "d" },
    { label: t("bestStreak"), value: cadence.longestStreak, suffix: "d" },
    { label: t("activeDays"), value: cadence.activeDaysInRange, suffix: "" },
    { label: t("events"), value: cadence.totalActivityEvents, suffix: "" },
  ];

  return (
    <PanelCard
      title={t("title")}
      icon={<Flame size={16} className="text-amber-400" />}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3"
          >
            <div className="text-2xl font-semibold text-zinc-100">
              {tile.value}
              <span className="text-sm text-zinc-500 ml-0.5">{tile.suffix}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">{tile.label}</div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
