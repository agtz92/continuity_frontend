"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  RESET_TODAY_LAYOUT,
  TODAY_LAYOUT_QUERY,
  UPDATE_TODAY_LAYOUT,
} from "@/lib/graphql";
import {
  NON_HIDEABLE_TODAY_IDS,
  TODAY_SECTION_IDS,
  type TodaySectionId,
} from "@/lib/todaySections";

type LayoutPayload = { order: string[]; hidden: string[] };

/**
 * Merge stored layout with the canonical list so:
 *  - unknown ids from older data are dropped,
 *  - newly added canonical sections appear at the end (visible & reorderable).
 * Mirrors the backend's `get_today_layout` so optimistic UI matches the
 * server's response.
 */
function reconcile(raw: LayoutPayload | undefined): {
  order: TodaySectionId[];
  hidden: Set<TodaySectionId>;
} {
  const canonical = new Set<string>(TODAY_SECTION_IDS);
  const stored = (raw?.order ?? []).filter((id): id is TodaySectionId =>
    canonical.has(id)
  );
  const seen = new Set(stored);
  const order = stored.concat(
    TODAY_SECTION_IDS.filter((id) => !seen.has(id))
  );
  const hidden = new Set<TodaySectionId>(
    (raw?.hidden ?? []).filter(
      (id): id is TodaySectionId =>
        canonical.has(id) && !NON_HIDEABLE_TODAY_IDS.has(id as TodaySectionId)
    )
  );
  return { order, hidden };
}

const DEBOUNCE_MS = 600;

export function useTodayLayout() {
  const { data } = useQuery<{ todayLayout: LayoutPayload }>(TODAY_LAYOUT_QUERY, {
    fetchPolicy: "cache-first",
  });
  const [updateMutation] = useMutation(UPDATE_TODAY_LAYOUT);
  const [resetMutation] = useMutation(RESET_TODAY_LAYOUT);

  const serverState = useMemo(() => reconcile(data?.todayLayout), [data]);

  // Local optimistic state — updates instantly; debounced flush hits server.
  const [order, setOrder] = useState<TodaySectionId[]>(serverState.order);
  const [hidden, setHidden] = useState<Set<TodaySectionId>>(serverState.hidden);
  const [editMode, setEditMode] = useState(false);

  // Sync when the server response arrives or refreshes. We don't overwrite
  // local state once a user is actively in edit mode (avoid clobbering a
  // drag that hasn't been flushed yet).
  const initializedRef = useRef(false);
  useEffect(() => {
    if (editMode) return;
    if (!data) return;
    setOrder(serverState.order);
    setHidden(serverState.hidden);
    initializedRef.current = true;
  }, [data, editMode, serverState.order, serverState.hidden]);

  // Debounced flush.
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(
    (nextOrder: TodaySectionId[], nextHidden: Set<TodaySectionId>) => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        updateMutation({
          variables: {
            order: nextOrder,
            hidden: Array.from(nextHidden),
          },
        }).catch(() => {
          // Rollback to server truth if write fails.
          setOrder(serverState.order);
          setHidden(serverState.hidden);
        });
      }, DEBOUNCE_MS);
    },
    [updateMutation, serverState.order, serverState.hidden]
  );

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  const toggleVisibility = useCallback(
    (id: TodaySectionId) => {
      if (NON_HIDEABLE_TODAY_IDS.has(id)) return;
      setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        flush(order, next);
        return next;
      });
    },
    [flush, order]
  );

  const reorder = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx) return;
      setOrder((prev) => {
        if (
          fromIdx < 0 ||
          fromIdx >= prev.length ||
          toIdx < 0 ||
          toIdx >= prev.length
        ) {
          return prev;
        }
        const next = prev.slice();
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        flush(next, hidden);
        return next;
      });
    },
    [flush, hidden]
  );

  const reset = useCallback(async () => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    try {
      const result = await resetMutation();
      const payload = result.data?.resetTodayLayout as LayoutPayload | undefined;
      const next = reconcile(payload);
      setOrder(next.order);
      setHidden(next.hidden);
    } catch {
      // Keep current state — user can retry.
    }
  }, [resetMutation]);

  const flushNow = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    updateMutation({
      variables: { order, hidden: Array.from(hidden) },
    }).catch(() => undefined);
  }, [updateMutation, order, hidden]);

  return {
    order,
    hidden,
    editMode,
    setEditMode,
    toggleVisibility,
    reorder,
    reset,
    flushNow,
    isVisible: (id: TodaySectionId) => !hidden.has(id),
  };
}

export type UseTodayLayoutReturn = ReturnType<typeof useTodayLayout>;
