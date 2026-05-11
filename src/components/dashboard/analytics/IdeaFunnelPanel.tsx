"use client";

import { ArrowRightCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { IdeaFunnel } from "@/lib/types";
import { PanelCard } from "./PanelCard";

export function IdeaFunnelPanel({ funnel }: { funnel: IdeaFunnel }) {
  const t = useTranslations("analytics.ideaFunnel");
  const pct = Math.round(funnel.promotionRate * 100);
  return (
    <PanelCard
      title={t("title")}
      icon={<ArrowRightCircle size={16} className="text-pink-400" />}
      subtitle={t("subtitle")}
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg/50 border border-border rounded-lg p-3">
          <div className="text-2xl font-semibold text-text">
            {funnel.ideasCreated}
          </div>
          <div className="text-xs text-text-muted mt-1">{t("created")}</div>
        </div>
        <div className="bg-bg/50 border border-border rounded-lg p-3">
          <div className="text-2xl font-semibold text-accent">
            {funnel.ideasPromoted}
          </div>
          <div className="text-xs text-text-muted mt-1">{t("promoted")}</div>
        </div>
        <div className="bg-bg/50 border border-border rounded-lg p-3">
          <div className="text-2xl font-semibold text-text">
            {pct}
            <span className="text-sm text-text-muted ml-0.5">%</span>
          </div>
          <div className="text-xs text-text-muted mt-1">{t("rate")}</div>
        </div>
      </div>
    </PanelCard>
  );
}
