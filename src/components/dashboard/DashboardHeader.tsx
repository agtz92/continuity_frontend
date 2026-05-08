"use client";

import { Database, LogOut, Tags } from "lucide-react";

export function DashboardHeader({
  activeCount,
  launchedCount,
  stalledCount,
  backupOverdue,
  hasData,
  onOpenCategories,
  onOpenBackup,
  onSignOut,
}: {
  activeCount: number;
  launchedCount: number;
  stalledCount: number;
  backupOverdue: boolean;
  hasData: boolean;
  onOpenCategories: () => void;
  onOpenBackup: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Continuity
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2 text-xs items-center flex-wrap">
          <button
            onClick={onOpenCategories}
            className="px-2 sm:px-3 py-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-2"
            title="Manage categories"
            aria-label="Manage categories"
          >
            <Tags size={14} />
            <span className="hidden sm:inline">Categories</span>
          </button>
          <button
            onClick={onOpenBackup}
            className={`px-2 sm:px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
              backupOverdue && hasData
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            aria-label="Backup"
          >
            <Database size={14} />
            <span className="hidden sm:inline">Backup</span>
          </button>
          <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-zinc-900 rounded-lg border border-zinc-800 leading-tight">
            <div className="text-zinc-500 text-[10px] sm:text-xs">Active</div>
            <div className="text-emerald-400 font-bold text-base sm:text-lg">
              {activeCount}
            </div>
          </div>
          <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-zinc-900 rounded-lg border border-zinc-800 leading-tight">
            <div className="text-zinc-500 text-[10px] sm:text-xs">Launched</div>
            <div className="text-blue-400 font-bold text-base sm:text-lg">
              {launchedCount}
            </div>
          </div>
          {stalledCount > 0 && (
            <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-500/10 rounded-lg border border-amber-500/30 leading-tight">
              <div className="text-amber-500/80 text-[10px] sm:text-xs">Stalled</div>
              <div className="text-amber-400 font-bold text-base sm:text-lg">
                {stalledCount}
              </div>
            </div>
          )}
          <button
            onClick={onSignOut}
            className="px-3 py-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-2"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
