"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CadenceStats } from "@/lib/types";
import { PanelCard } from "./PanelCard";

export function CadencePanel({ cadence }: { cadence: CadenceStats }) {
  const t = useTranslations("analytics.cadence");
  const tiles = [
    { label: t("activeDays"), value: cadence.activeDaysInRange, suffix: "" },
    { label: t("events"), value: cadence.totalActivityEvents, suffix: "" },
  ];

  return (
    <PanelCard
      title={t("title")}
      icon={<CalendarDays size={16} className="text-amber-400" />}
    >
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="bg-bg/50 border border-border rounded-lg p-3"
          >
            <div className="text-2xl font-semibold text-text">
              {tile.value}
              <span className="text-sm text-text-muted ml-0.5">{tile.suffix}</span>
            </div>
            <div className="text-xs text-text-muted mt-1">{tile.label}</div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
