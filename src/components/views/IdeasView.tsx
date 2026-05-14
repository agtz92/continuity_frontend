"use client";

import { useState } from "react";
import { Edit2, Lightbulb, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Idea } from "@/lib/types";
import { FAB } from "../ui/FAB";

export function IdeasView({
  ideas,
  onCapture,
  onEdit,
  onPromote,
  onDelete,
}: {
  ideas: Idea[];
  onCapture: () => void;
  onEdit: (idea: Idea) => void;
  onPromote: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.ideas");
  const tCommon = useTranslations("common");
  const [ideaSearch, setIdeaSearch] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={ideaSearch}
              onChange={(e) => setIdeaSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-text-muted"
            />
          </div>
          <button
            onClick={onCapture}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-text rounded-lg font-medium text-sm hidden md:flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> {t("capture")}
          </button>
        </div>
      </div>
      <p className="text-sm text-text-muted mb-4">{t("subtitle")}</p>
      {ideas.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-muted">
          {t("empty")}
        </div>
      ) : (() => {
        const q = ideaSearch.trim().toLowerCase();
        const filteredIdeas = q
          ? ideas.filter(
              (i) =>
                i.title.toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q) ||
                i.why.toLowerCase().includes(q)
            )
          : ideas;

        if (filteredIdeas.length === 0) {
          return (
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
              {t("noMatch", { query: ideaSearch })}
            </div>
          );
        }

        return (
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredIdeas.map((i) => (
              <div
                key={i.id}
                className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="text-purple-400 shrink-0 mt-0.5" size={16} />
                  <div className="font-semibold text-purple-800 dark:text-purple-100 flex-1 break-words">
                    {i.title}
                  </div>
                </div>
                {i.why && (
                  <div className="text-sm text-purple-700/80 dark:text-purple-200/80 italic mb-2 break-words">
                    → {i.why}
                  </div>
                )}
                {i.description && (
                  <div className="text-sm text-text-muted mb-3 break-words">
                    {i.description}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onPromote(i.id)}
                    className="text-xs px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-200 rounded-md"
                  >
                    {t("promote")}
                  </button>
                  <button
                    onClick={() => onEdit(i)}
                    className="text-xs px-3 py-1.5 bg-border hover:opacity-80 text-text-muted rounded-md flex items-center gap-1"
                  >
                    <Edit2 size={12} /> {tCommon("edit")}
                  </button>
                  <button
                    onClick={() => onDelete(i.id)}
                    className="text-xs px-3 py-1.5 bg-border hover:opacity-80 text-text-muted rounded-md"
                  >
                    {tCommon("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      <FAB
        icon={<Plus size={24} />}
        label={t("captureAria")}
        onClick={onCapture}
        className="!bg-purple-500 !text-white"
      />
    </div>
  );
}
