"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { DASHBOARD_QUERY } from "@/lib/graphql";
import {
  cancelConversation,
  getActions,
  getUsage,
  runAction,
  type AssistantMode,
  type CannedGroup,
  type UsageSnapshot,
} from "@/lib/assistantApi";
import {
  streamChat,
  StreamHttpError,
  type AssistantEvent,
} from "@/lib/assistantStream";

export type AssistantTextBlock = { type: "text"; text: string };
export type AssistantToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
};
export type AssistantBlock = AssistantTextBlock | AssistantToolUseBlock;

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; blocks: AssistantBlock[] };

export type AssistantState = {
  messages: ChatMessage[];
  conversationId: string | null;
  streaming: boolean;
  error: string | null;
  plan: "free" | "pro" | "studio" | "admin";
  /**
   * Which assistant this account gets. Comes from the server so the rule
   * lives in one place; `null` until the first usage fetch resolves.
   */
  mode: AssistantMode | null;
  /** Populated only in `canned` mode. */
  actions: CannedGroup[];
  usage: UsageSnapshot | null;
};

const INITIAL: AssistantState = {
  messages: [],
  conversationId: null,
  streaming: false,
  error: null,
  plan: "free",
  mode: null,
  actions: [],
  usage: null,
};

export function useAssistant() {
  const [state, setState] = useState<AssistantState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const usedToolRef = useRef(false);
  const apollo = useApolloClient();

  const refreshUsage = useCallback(async () => {
    try {
      const snap = await getUsage();
      setState((s) => ({
        ...s,
        usage: snap,
        plan: snap.plan,
        mode: snap.assistant_mode,
      }));
      return snap.assistant_mode;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // The catalogue only exists for `canned`, and asking for it in any
    // other mode is a guaranteed 403 — so resolve the mode first.
    (async () => {
      const mode = await refreshUsage();
      if (mode !== "canned") return;
      try {
        const groups = await getActions();
        setState((s) => ({ ...s, actions: groups }));
      } catch {
        /* the panel falls back to an empty catalogue */
      }
    })();
  }, [refreshUsage]);

  const send = useCallback(
    async (content: string) => {
      if (state.streaming) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      const userId = `local-${Date.now()}`;
      usedToolRef.current = false;
      setState((s) => ({
        ...s,
        streaming: true,
        error: null,
        messages: [
          ...s.messages,
          { id: userId, role: "user", text: trimmed },
          { id: `${userId}-pending`, role: "assistant", blocks: [] },
        ],
      }));

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const assistantBlocks: AssistantBlock[] = [];

      const append = (block: AssistantBlock) => {
        assistantBlocks.push(block);
        setState((s) => ({
          ...s,
          messages: replaceLastAssistant(s.messages, [...assistantBlocks]),
        }));
      };

      try {
        await streamChat({
          conversationId: state.conversationId ?? undefined,
          content: trimmed,
          signal: ctrl.signal,
          onEvent: (event: AssistantEvent) => {
            if (event.kind === "meta") {
              setState((s) => ({
                ...s,
                conversationId: event.payload.conversation_id,
                plan: event.payload.plan,
              }));
            } else if (event.kind === "text_delta") {
              const last = assistantBlocks[assistantBlocks.length - 1];
              if (last?.type === "text") {
                last.text += event.payload.text;
                setState((s) => ({
                  ...s,
                  messages: replaceLastAssistant(
                    s.messages,
                    [...assistantBlocks],
                  ),
                }));
              } else {
                append({ type: "text", text: event.payload.text });
              }
            } else if (event.kind === "tool_use_start") {
              usedToolRef.current = true;
              append({
                type: "tool_use",
                id: event.payload.id,
                name: event.payload.name,
                input: event.payload.input,
              });
            } else if (event.kind === "tool_result") {
              const block = assistantBlocks.find(
                (b) => b.type === "tool_use" && b.id === event.payload.id,
              ) as AssistantToolUseBlock | undefined;
              if (block) {
                block.output = event.payload.output;
                setState((s) => ({
                  ...s,
                  messages: replaceLastAssistant(
                    s.messages,
                    [...assistantBlocks],
                  ),
                }));
              }
            } else if (event.kind === "error") {
              setState((s) => ({ ...s, error: event.payload.message }));
            }
          },
        });
      } catch (err) {
        if (ctrl.signal.aborted) {
          setState((s) => ({ ...s, error: "Stopped" }));
        } else if (err instanceof StreamHttpError) {
          const body = err.body as
            | { error?: string; kind?: string }
            | null;
          if (err.status === 429) {
            setState((s) => ({
              ...s,
              error:
                body?.kind === "daily_messages"
                  ? "Daily message limit reached."
                  : body?.error || "Rate limit reached.",
            }));
          } else if (err.status === 413) {
            setState((s) => ({
              ...s,
              error: body?.error || "Message too long.",
            }));
          } else if (err.status === 403) {
            // The plan changed under us (downgrade, expiry). Re-read the
            // mode so the panel switches to the right assistant instead of
            // showing a composer that can only fail.
            setState((s) => ({
              ...s,
              error: body?.error || "Not available on this plan.",
            }));
            refreshUsage();
          } else if (err.status === 401) {
            setState((s) => ({ ...s, error: "Session expired. Sign in again." }));
          } else {
            setState((s) => ({ ...s, error: body?.error || err.message }));
          }
        } else {
          setState((s) => ({
            ...s,
            error: (err as Error).message || "Unknown error",
          }));
        }
      } finally {
        abortRef.current = null;
        setState((s) => ({ ...s, streaming: false }));
        refreshUsage();
        // The assistant runs tools server-side that can create/update/delete
        // projects, tasks, ideas, routines, etc. — none of which go through
        // Apollo on the client. Refetch the dashboard so anything the AI
        // touched shows up the moment the user returns to a data view.
        if (usedToolRef.current) {
          usedToolRef.current = false;
          apollo
            .refetchQueries({ include: [DASHBOARD_QUERY] })
            .catch(() => undefined);
        }
      }
    },
    [state.streaming, state.conversationId, refreshUsage, apollo],
  );

  /**
   * Run one catalogue action (the `canned` tier). Not a variant of `send`:
   * there is no stream, no model and nothing to cancel — a question, a
   * query, an answer. The user's side of the thread is the action's own
   * label, so the transcript reads like a conversation.
   */
  const runCanned = useCallback(
    async (actionId: string, label: string, query = "") => {
      if (state.streaming) return;
      const localId = `local-${Date.now()}`;
      setState((s) => ({
        ...s,
        streaming: true,
        error: null,
        messages: [
          ...s.messages,
          { id: localId, role: "user", text: label },
          { id: `${localId}-pending`, role: "assistant", blocks: [] },
        ],
      }));

      try {
        const answer = await runAction(actionId, {
          conversationId: state.conversationId ?? undefined,
          query,
        });
        setState((s) => ({
          ...s,
          conversationId: answer.conversation_id,
          messages: replaceLastAssistant(
            s.messages,
            answer.content.map((b) => ({ type: "text", text: b.text })),
          ),
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          error: (err as Error).message || "Unknown error",
        }));
      } finally {
        setState((s) => ({ ...s, streaming: false }));
      }
    },
    [state.streaming, state.conversationId],
  );

  const stop = useCallback(async () => {
    const ctrl = abortRef.current;
    if (ctrl) ctrl.abort();
    if (state.conversationId) {
      try {
        await cancelConversation(state.conversationId);
      } catch {
        /* swallow */
      }
    }
  }, [state.conversationId]);

  const newConversation = useCallback(() => {
    if (state.streaming) return;
    setState((s) => ({ ...s, messages: [], conversationId: null, error: null }));
  }, [state.streaming]);

  return { ...state, send, runCanned, stop, newConversation, refreshUsage };
}

function replaceLastAssistant(
  messages: ChatMessage[],
  blocks: AssistantBlock[],
): ChatMessage[] {
  const out = [...messages];
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].role === "assistant") {
      out[i] = { ...out[i], blocks } as ChatMessage;
      break;
    }
  }
  return out;
}
