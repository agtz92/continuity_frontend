"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Send, Square, Sparkles, X, Plus, AlertCircle } from "lucide-react";
import { useAssistant } from "@/hooks/useAssistant";
import { MessageList } from "./MessageList";
import { PlanBadge } from "./PlanBadge";
import { UsageMeter } from "./UsageMeter";
import { QuickActionChips } from "./QuickActionChips";

const MAX_INPUT_CHARS = 4000;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AssistantPanel({ open, onClose }: Props) {
  const t = useTranslations("assistant");
  const {
    messages,
    streaming,
    error,
    plan,
    usage,
    send,
    stop,
    newConversation,
  } = useAssistant();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !streaming) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, streaming]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (streaming || !input.trim()) return;
    const text = input;
    setInput("");
    await send(text);
  };

  const handleQuickAction = (prompt: string) => {
    if (streaming) return;
    send(prompt);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => !streaming && onClose()}
      />
      <aside className="relative w-full sm:w-[28rem] h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-md bg-gradient-to-br from-emerald-400 to-blue-400 text-zinc-950 flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                {t("title")}
                <PlanBadge plan={plan} />
              </div>
              <div className="text-[11px] text-zinc-500">{t("subtitle")}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={newConversation}
              disabled={streaming || messages.length === 0}
              className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-md hover:bg-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("newChat")}
              aria-label={t("newChat")}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={streaming}
              className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-md hover:bg-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t("close")}
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <UsageMeter usage={usage} />

        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-start gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <Sparkles size={20} className="text-emerald-400" />
            </div>
            <div className="max-w-xs">
              <div className="text-sm font-semibold text-zinc-200 mb-1">
                {t("welcome.title")}
              </div>
              <div className="text-xs text-zinc-500 leading-relaxed">
                {t("welcome.body")}
              </div>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}

        {error && (
          <div className="mx-3 mb-2 flex items-start gap-2 px-3 py-2 rounded-md border border-amber-500/30 bg-amber-500/5 text-amber-200 text-xs">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <QuickActionChips onPick={handleQuickAction} disabled={streaming} />

        <form
          onSubmit={handleSubmit}
          className="border-t border-zinc-800/80 p-3 flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as FormEvent);
              }
            }}
            placeholder={t("inputPlaceholder")}
            rows={2}
            disabled={streaming}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none disabled:opacity-60"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 flex items-center justify-center"
              aria-label={t("stop")}
              title={t("stop")}
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label={t("send")}
              title={t("send")}
            >
              <Send size={14} />
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}
