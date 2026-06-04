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

  // Initialize local state from server ONCE, when the first response lands.
  // After that, the cache update inside the mutation keeps things in sync —
  // resyncing on every server-data change would clobber pending optimistic
  // edits when the user exits edit mode before the debounce fires.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    if (!data) return;
    setOrder(serverState.order);
    setHidden(serverState.hidden);
    initializedRef.current = true;
  }, [data, serverState.order, serverState.hidden]);

  // Debounced flush. Writes the new layout to both the server and Apollo
  // cache so the next query read matches the optimistic UI.
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(
    (nextOrder: TodaySectionId[], nextHidden: Set<TodaySectionId>) => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      const hiddenArr = Array.from(nextHidden);
      pendingTimerRef.current = setTimeout(() => {
        updateMutation({
          variables: { order: nextOrder, hidden: hiddenArr },
          optimisticResponse: {
            updateTodayLayout: {
              __typename: "TodayLayout",
              order: nextOrder,
              hidden: hiddenArr,
            },
          },
          update: (cache, { data: mutData }) => {
            const payload = mutData?.updateTodayLayout;
            if (!payload) return;
            cache.writeQuery({
              query: TODAY_LAYOUT_QUERY,
              data: { todayLayout: payload },
            });
          },
        }).catch((err) => {
          // Roll back to last known server state and surface the reason.
          // eslint-disable-next-line no-console
          console.error("[useTodayLayout] update failed:", err);
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
      const result = await resetMutation({
        update: (cache, { data: mutData }) => {
          const payload = (mutData as { resetTodayLayout?: LayoutPayload } | null)
            ?.resetTodayLayout;
          if (!payload) return;
          cache.writeQuery({
            query: TODAY_LAYOUT_QUERY,
            data: { todayLayout: payload },
          });
        },
      });
      const payload = (result.data as { resetTodayLayout?: LayoutPayload } | null)
        ?.resetTodayLayout;
      const next = reconcile(payload ?? undefined);
      setOrder(next.order);
      setHidden(next.hidden);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[useTodayLayout] reset failed:", err);
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
