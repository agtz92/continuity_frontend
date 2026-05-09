"use client";

import { MoonStar, Lightbulb } from "lucide-react";
import type { SleepingProjectRow, StaleIdeaRow } from "@/lib/types";
import { PanelCard } from "./PanelCard";

const BUCKET_TONE: Record<SleepingProjectRow["bucket"], string> = {
  "7-14": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "15-30": "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "30+": "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function SleepingStalePanel({
  sleeping,
  stale,
}: {
  sleeping: SleepingProjectRow[];
  stale: StaleIdeaRow[];
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <PanelCard
        title="Durmiendo"
        icon={<MoonStar size={16} className="text-indigo-400" />}
        subtitle="Proyectos sin actividad reciente (≥7 días)"
      >
        {sleeping.length === 0 ? (
          <div className="text-sm text-zinc-500 py-4">
            Nada durmiendo. Buen ritmo.
          </div>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {sleeping.map((s) => (
              <li
                key={s.projectId}
                className="flex items-center justify-between gap-3 bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2"
              >
                <div className="text-sm text-zinc-100 truncate">{s.name}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${BUCKET_TONE[s.bucket]}`}
                  >
                    {s.bucket}d
                  </span>
                  <span className="text-xs text-zinc-400 tabular-nums">
                    {s.daysIdle}d
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard
        title="Ideas estancadas"
        icon={<Lightbulb size={16} className="text-yellow-400" />}
        subtitle="Sin promover en ≥30 días"
      >
        {stale.length === 0 ? (
          <div className="text-sm text-zinc-500 py-4">
            Sin ideas estancadas.
          </div>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {stale.map((s) => (
              <li
                key={s.ideaId}
                className="flex items-center justify-between gap-3 bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2"
              >
                <div className="text-sm text-zinc-100 truncate">{s.title}</div>
                <span className="text-xs text-zinc-400 tabular-nums shrink-0">
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
