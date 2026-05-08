"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Project, UpdateEntry } from "@/lib/types";

export function LogView({
  updates,
  projects,
}: {
  updates: UpdateEntry[];
  projects: Project[];
}) {
  const [logSearch, setLogSearch] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Activity Log</h2>
        <div className="relative flex-1 sm:max-w-md sm:ml-auto">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search log entries or project..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-zinc-600"
          />
        </div>
      </div>
      {updates.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
          No activity logged yet. Log updates from your projects to track momentum.
        </div>
      ) : (() => {
        const q = logSearch.trim().toLowerCase();
        const filteredUpdates = q
          ? updates.filter((u) => {
              const proj = projects.find((p) => p.id === u.projectId);
              return (
                u.note.toLowerCase().includes(q) ||
                (proj?.name.toLowerCase().includes(q) ?? false)
              );
            })
          : updates;

        if (filteredUpdates.length === 0) {
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
              No log entries match &ldquo;{logSearch}&rdquo;
            </div>
          );
        }

        return (
          <div className="space-y-2">
            {filteredUpdates.map((u) => {
              const proj = projects.find((p) => p.id === u.projectId);
              return (
                <div
                  key={u.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row gap-1 sm:gap-3"
                >
                  <div className="text-xs text-zinc-500 shrink-0 sm:w-24">
                    {new Date(u.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    {proj && (
                      <div className="text-xs text-emerald-400 mb-0.5">
                        {proj.name}
                      </div>
                    )}
                    <div className="text-sm text-zinc-200 break-words">{u.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
