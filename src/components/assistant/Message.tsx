"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import type { ChatMessage } from "@/hooks/useAssistant";
import { ToolCallCard } from "./ToolCallCard";

export function Message({ message }: { message: ChatMessage }) {
  const t = useTranslations("assistant.message");

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-50 whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }

  // assistant
  const isEmpty = message.blocks.length === 0;
  return (
    <div className="flex gap-2">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 text-zinc-950 flex items-center justify-center">
        <Sparkles size={14} />
      </div>
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <div className="text-xs text-zinc-500 italic animate-pulse">
            {t("thinking")}
          </div>
        ) : (
          message.blocks.map((block, i) => {
            if (block.type === "text") {
              return (
                <div
                  key={i}
                  className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed"
                >
                  {block.text}
                </div>
              );
            }
            return <ToolCallCard key={block.id} block={block} />;
          })
        )}
      </div>
    </div>
  );
}
