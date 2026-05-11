"use client";

import { useState } from "react";
import { Edit2, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Project, UpdateEntry } from "@/lib/types";

export function LogView({
  updates,
  projects,
  onEditUpdate,
  onDeleteUpdate,
}: {
  updates: UpdateEntry[];
  projects: Project[];
  onEditUpdate: (u: UpdateEntry) => void;
  onDeleteUpdate: (id: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.log");
  const locale = useLocale();
  const [logSearch, setLogSearch] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="relative flex-1 sm:max-w-md sm:ml-auto">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-text-muted"
          />
        </div>
      </div>
      {updates.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-muted">
          {t("empty")}
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
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
              {t("noMatch", { query: logSearch })}
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
                  className="bg-surface border border-border rounded-lg p-3 flex flex-col sm:flex-row gap-1 sm:gap-3 group"
                >
                  <div className="text-xs text-text-muted shrink-0 sm:w-24">
                    {new Date(u.date).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    {proj && (
                      <div className="text-xs text-accent mb-0.5">
                        {proj.name}
                      </div>
                    )}
                    <div className="text-sm text-text break-words">{u.note}</div>
                  </div>
                  <div className="flex items-start gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditUpdate(u)}
                      className="text-text-muted hover:text-accent"
                      aria-label={t("editEntryAria")}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t("deleteConfirm"))) onDeleteUpdate(u.id);
                      }}
                      className="text-text-muted hover:text-red-400"
                      aria-label={t("deleteEntryAria")}
                    >
                      <X size={14} />
                    </button>
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
