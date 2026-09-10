"use client";

import { useState } from "react";
import { Edit2, Lightbulb, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, Idea, Priority } from "@/lib/types";
import { daysSince } from "@/lib/date";
import { FAB } from "../ui/FAB";
import { Meta } from "../ui/Meta";
import { PromoteIdeaModal } from "../ideas/PromoteIdeaModal";
import { EmptyState, EmptyStateAction } from "../ui/EmptyState";

/** A partir de aquí la idea lleva demasiado en la bandeja para seguir siendo
 *  "reciente". Mismo umbral que el tramo templado del enfriamiento. */
const COOLING_DAYS = 7;

export function IdeasView({
  ideas,
  categories,
  onCapture,
  onEdit,
  onPromote,
  onDelete,
}: {
  ideas: Idea[];
  categories: Category[];
  onCapture: () => void;
  onEdit: (idea: Idea) => void;
  /** Promover pasa SIEMPRE por el modal ceremonioso: la primera acción es
   *  obligatoria y no hay camino corto que se la salte. */
  onPromote: (
    id: string,
    extra: { firstAction: string; categoryId: string | null; priority: Priority }
  ) => Promise<boolean> | boolean;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.ideas");
  const tCommon = useTranslations("common");
  const [ideaSearch, setIdeaSearch] = useState("");
  const [promoting, setPromoting] = useState<Idea | null>(null);

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
            className="px-4 py-2 bg-line-06 hover:bg-line-08 text-text rounded-lg font-medium text-sm hidden md:flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> {t("capture")}
          </button>
        </div>
      </div>
      <p className="text-sm text-text-muted mb-4">{t("subtitle")}</p>
      {ideas.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          body={t("empty")}
          actions={
            <EmptyStateAction label={t("addFirst")} onClick={onCapture} />
          }
        />
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
            <div className="bg-surface border border-border rounded-lg p-8 text-center text-text-muted text-sm">
              {t("noMatch", { query: ideaSearch })}
            </div>
          );
        }

        return (
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredIdeas.map((i) => (
              <div
                key={i.id}
                className="bg-line-06 border border-line-22 rounded-lg p-4"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="text-text-3 shrink-0 mt-0.5" size={16} />
                  <div className="font-semibold text-text-3 flex-1 break-words">
                    {i.title}
                  </div>
                </div>
                {i.why && (
                  <div className="text-sm text-text-3 italic mb-2 break-words">
                    → {i.why}
                  </div>
                )}
                {i.description && (
                  <div className="text-sm text-text-muted mb-3 break-words">
                    {i.description}
                  </div>
                )}
                {/* Cuánto lleva en la bandeja. Se apaga mientras es reciente y
                    sube a tinta plena cuando ya se está enfriando: una idea
                    vieja no es una alarma, pero tiene que verse. */}
                <Meta
                  variant="cintillo"
                  tone={(daysSince(i.created) ?? 0) > COOLING_DAYS ? "muted" : "faint"}
                  className="block mb-3"
                >
                  {t("inInbox", { count: daysSince(i.created) ?? 0 })}
                </Meta>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setPromoting(i)}
                    className="text-xs px-3 py-1.5 bg-line-06 hover:bg-line-08 text-text-3 rounded-md"
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

      {promoting && (
        <PromoteIdeaModal
          idea={promoting}
          categories={categories}
          onClose={() => setPromoting(null)}
          onPromote={onPromote}
        />
      )}

      <FAB
        icon={<Plus size={24} />}
        label={t("captureAria")}
        onClick={onCapture}
        className="!bg-line-06 !text-white"
      />
    </div>
  );
}
