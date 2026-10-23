"use client";

import { Fragment, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { ChatMessage } from "@/hooks/useAssistant";
import { Message } from "./Message";
import { StudioHint } from "./StudioHint";
import { toolLabel } from "./ToolCallCard";

export function MessageList({
  messages,
  streaming,
  pendingTool = null,
  onDismissHints,
}: {
  messages: ChatMessage[];
  streaming: boolean;
  /** Tool the model is writing (`tool_use_pending`), if any. */
  pendingTool?: string | null;
  /** `canned` only: hides the Studio hints for this conversation. */
  onDismissHints?: () => void;
}) {
  const t = useTranslations("assistant.message");
  const endRef = useRef<HTMLDivElement | null>(null);

  const last = messages[messages.length - 1];
  const lastBlocks = last && last.role === "assistant" ? last.blocks : [];
  const lastBlock = lastBlocks[lastBlocks.length - 1];
  const toolRunning =
    lastBlock?.type === "tool_use" && lastBlock.output === undefined;
  // Persistent "working" indicator. The empty-message "Thinking…" covers
  // the first gap, and a running ToolCallCard shows its own state — this
  // footer fills every OTHER silent gap (notably between tool rounds,
  // while the model decides its next step) so the user always has a sign
  // that Claude is still busy.
  const showWorking = streaming && lastBlocks.length > 0 && !toolRunning;
  // A long tool input (note bodies, prompts) can take a minute to write.
  // Naming it beats a generic "working" that looks frozen.
  const pendingLabel =
    streaming && pendingTool
      ? t("writing", { tool: toolLabel(pendingTool) })
      : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, showWorking]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((m, i) => (
        <Fragment key={m.id}>
          <Message
            message={m}
            // Solo el ÚLTIMO mensaje puede tener un bloque a medias. Pasarle
            // `streaming` a los anteriores dejaría sus tablas en "escribiendo…"
            // para siempre.
            streaming={streaming && i === messages.length - 1}
            pendingLabel={i === messages.length - 1 ? pendingLabel : null}
          />
          {m.role === "assistant" && m.hint && onDismissHints && (
            <StudioHint hint={m.hint} onDismiss={onDismissHints} />
          )}
        </Fragment>
      ))}
      {showWorking && (
        <div
          className="flex items-center gap-2 pl-9 text-xs text-text-muted"
          role="status"
          aria-live="polite"
        >
          <span className="flex gap-1" aria-hidden="true">
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </span>
          <span>{pendingLabel ?? t("working")}</span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
