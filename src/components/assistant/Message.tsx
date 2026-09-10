"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import type { ChatMessage } from "@/hooks/useAssistant";
import { ToolCallCard } from "./ToolCallCard";
import { Markdown } from "@/components/markdown/Markdown";

export function Message({
  message,
  streaming = false,
}: {
  message: ChatMessage;
  /** El turno sigue llegando: el último bloque puede estar a medias. */
  streaming?: boolean;
}) {
  const t = useTranslations("assistant.message");

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-accent-a12 border border-accent-a35 px-3 py-2 text-sm text-accent whitespace-pre-wrap break-words">
          {message.text}
        </div>
      </div>
    );
  }

  // assistant
  const isEmpty = message.blocks.length === 0;
  return (
    <div className="flex gap-2">
      <div className="shrink-0 w-7 h-7 rounded-full bg-accent text-bg flex items-center justify-center">
        <Sparkles size={14} />
      </div>
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <div className="text-xs text-text-muted italic animate-pulse">
            {t("thinking")}
          </div>
        ) : (
          message.blocks.map((block, i) => {
            if (block.type === "text") {
              // Aquí estaba el bug: `whitespace-pre-wrap` imprimía el markdown
              // crudo — los `**` a la vista y las tablas como escaleras de
              // tuberías. `streaming` hace que un bloque a medias no se pinte
              // como tabla hasta que cierre.
              return (
                <Markdown
                  key={i}
                  text={block.text}
                  variant="chat"
                  streaming={streaming}
                />
              );
            }
            return <ToolCallCard key={block.id} block={block} />;
          })
        )}
      </div>
    </div>
  );
}
