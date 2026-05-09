"use client";

import { ArrowRightCircle } from "lucide-react";
import type { IdeaFunnel } from "@/lib/types";
import { PanelCard } from "./PanelCard";

export function IdeaFunnelPanel({ funnel }: { funnel: IdeaFunnel }) {
  const pct = Math.round(funnel.promotionRate * 100);
  return (
    <PanelCard
      title="Idea funnel"
      icon={<ArrowRightCircle size={16} className="text-pink-400" />}
      subtitle="Ideas created vs promoted to projects"
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
          <div className="text-2xl font-semibold text-zinc-100">
            {funnel.ideasCreated}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Created</div>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
          <div className="text-2xl font-semibold text-emerald-300">
            {funnel.ideasPromoted}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Promoted</div>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
          <div className="text-2xl font-semibold text-zinc-100">
            {pct}
            <span className="text-sm text-zinc-500 ml-0.5">%</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">Rate</div>
        </div>
      </div>
    </PanelCard>
  );
}
