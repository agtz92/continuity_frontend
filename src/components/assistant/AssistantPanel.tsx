"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Send, Square, Sparkles, X, Plus, AlertCircle, Brain } from "lucide-react";
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
  const [deepMode, setDeepMode] = useState(false);

  // Free is read-only; pro/studio/admin can create and edit (write tools
  // require plan_required="pro"). Keep this in sync with the backend gating.
  const canWrite = plan !== "free";

  // Track the visual viewport so the panel resizes with the iOS keyboard
  // and the collapsing Safari URL bar. Without this the form (Send button)
  // ends up below the visible area on iPhone the moment the keyboard opens.
  const [viewport, setViewport] = useState<{
    height: number;
    offsetTop: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !streaming) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, streaming]);

  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () =>
      setViewport({ height: vv.height, offsetTop: vv.offsetTop });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (streaming || !input.trim()) return;
    const text = input;
    setInput("");
    await send(text, deepMode);
  };

  const handleQuickAction = (prompt: string) => {
    if (streaming) return;
    send(prompt, deepMode);
  };

  // Anchor the dialog to the visual viewport when available; otherwise fall
  // back to dynamic viewport units (works on iOS 15.4+ as a sane default).
  const containerStyle: CSSProperties = viewport
    ? { top: viewport.offsetTop, height: viewport.height }
    : { top: 0, height: "100dvh" };

  return (
    <div
      className="fixed left-0 right-0 z-50 flex justify-end overflow-hidden"
      style={containerStyle}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => !streaming && onClose()}
      />
      <aside className="relative w-full sm:w-[28rem] h-full min-h-0 bg-bg border-l border-border flex flex-col shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-md bg-gradient-to-br from-accent to-accent-2 text-bg flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text flex items-center gap-1.5">
                {t("title")}
                <PlanBadge plan={plan} />
              </div>
              <div className="text-[11px] text-text-muted">
                {t(canWrite ? "subtitleReadWrite" : "subtitle")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={newConversation}
              disabled={streaming || messages.length === 0}
              className="text-text-muted hover:text-text p-1.5 rounded-md hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("newChat")}
              aria-label={t("newChat")}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={streaming}
              className="text-text-muted hover:text-text p-1.5 rounded-md hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t("close")}
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <UsageMeter usage={usage} />

        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-start gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              <Sparkles size={20} className="text-accent" />
            </div>
            <div className="max-w-xs">
              <div className="text-sm font-semibold text-text mb-1">
                {t("welcome.title")}
              </div>
              <div className="text-xs text-text-muted leading-relaxed">
                {t(canWrite ? "welcome.bodyReadWrite" : "welcome.body")}
              </div>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} streaming={streaming} />
        )}

        {error && (
          <div className="mx-3 mb-2 flex items-start gap-2 px-3 py-2 rounded-md border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-200 text-xs">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <QuickActionChips onPick={handleQuickAction} disabled={streaming} />

        {(plan === "studio" || plan === "admin") && (
          <div className="px-3 pt-2">
            <button
              type="button"
              onClick={() => setDeepMode((v) => !v)}
              disabled={streaming}
              title={t("deepModeHint")}
              aria-pressed={deepMode}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                deepMode
                  ? "border-accent text-accent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                  : "border-border text-text-muted hover:text-text"
              }`}
            >
              <Brain size={12} />
              {t("deepMode")}
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-border/80 p-3 flex items-end gap-2"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
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
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 flex items-center justify-center"
              aria-label={t("stop")}
              title={t("stop")}
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 w-9 h-9 rounded-lg bg-accent text-bg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
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
