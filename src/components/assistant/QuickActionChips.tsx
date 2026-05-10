"use client";

import { useTranslations } from "next-intl";

const ACTION_KEYS = [
  "priorities",
  "sleeping",
  "lastWeek",
  "staleIdeas",
] as const;

type ActionKey = (typeof ACTION_KEYS)[number];

const PROMPTS: Record<ActionKey, string> = {
  priorities: "Suggest priorities for this week based on my projects and overdue tasks.",
  sleeping: "Summarize my sleeping projects and suggest one small next step for each.",
  lastWeek: "What did I work on in the last 7 days?",
  staleIdeas: "Show me stale ideas (older than 30 days) and tell me which look most promising.",
};

export function QuickActionChips({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("assistant.quickActions");
  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2">
      {ACTION_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPick(PROMPTS[k])}
          disabled={disabled}
          className="text-[11px] px-2 py-1 rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t(k)}
        </button>
      ))}
    </div>
  );
}
