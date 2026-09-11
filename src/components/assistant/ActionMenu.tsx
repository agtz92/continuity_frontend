"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { CannedGroup } from "@/lib/assistantApi";

/**
 * The `canned` tier's composer: a menu, not a text box.
 *
 * The honest shape for a chat with no model behind it. Every button runs a
 * real query and always answers, so nothing here can fail to be understood
 * — which is exactly what a free-text field would promise and not deliver.
 * The one exception is search, which needs a term and says so.
 *
 * Labels come from the server with the catalogue, so a new question needs
 * no release here.
 */
export function ActionMenu({
  groups,
  onRun,
  disabled,
}: {
  groups: CannedGroup[];
  onRun: (actionId: string, label: string, query?: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("assistant.actions");
  const [query, setQuery] = useState("");

  const searchAction = groups
    .flatMap((g) => g.actions)
    .find((a) => a.needs_query);

  return (
    <div className="shrink-0 border-t border-border">
      <div className="flex flex-col gap-3 px-3 pb-3 pt-3">
        <p className="text-[11px] uppercase tracking-wide text-text-3">
          {t("hint")}
        </p>

        {groups
          .filter((g) => g.actions.some((a) => !a.needs_query))
          .map((group) => (
            <div key={group.group} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-text-muted">
                {group.label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.actions
                  .filter((a) => !a.needs_query)
                  .map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onRun(action.id, action.label)}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] text-text-muted transition-colors hover:border-text-muted hover:bg-surface hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {action.label}
                    </button>
                  ))}
              </div>
            </div>
          ))}
      </div>

      {searchAction && (
        <form
          className="flex items-end gap-2 border-t border-border p-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (!q || disabled) return;
            onRun(searchAction.id, `${searchAction.label}: ${q}`, q);
            setQuery("");
          }}
        >
          <div className="relative flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              disabled={disabled}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchAction.placeholder}
              aria-label={searchAction.label}
              className="w-full rounded-lg border border-border bg-surface py-2 pl-7 pr-3 text-[13px] text-text placeholder:text-text-3 focus:border-accent focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={disabled || !query.trim()}
            className="rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {searchAction.label}
          </button>
        </form>
      )}
    </div>
  );
}
