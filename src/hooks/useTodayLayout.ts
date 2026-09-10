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

/** Las dos columnas del Home. `main` es la ancha; `rail` la lateral. */
export type TodayColumn = "main" | "rail";

export type LayoutPayload = {
  order: string[];
  hidden: string[];
  rail?: string[];
};

/**
 * Merge stored layout with the canonical list so:
 *  - unknown ids from older data are dropped,
 *  - newly added canonical sections appear at the end (visible & reorderable),
 *  - nada aparece en las dos columnas: el rail manda.
 *
 * Mirrors the backend's `get_today_layout` so optimistic UI matches the
 * server's response.
 */
export function reconcileLayout(raw: LayoutPayload | undefined): {
  order: TodaySectionId[];
  rail: TodaySectionId[];
  hidden: Set<TodaySectionId>;
} {
  const canonical = new Set<string>(TODAY_SECTION_IDS);
  const rail = (raw?.rail ?? []).filter((id): id is TodaySectionId =>
    canonical.has(id)
  );
  const inRail = new Set<string>(rail);

  const stored = (raw?.order ?? []).filter(
    (id): id is TodaySectionId => canonical.has(id) && !inRail.has(id)
  );
  const seen = new Set<string>([...stored, ...rail]);
  const order = stored.concat(
    TODAY_SECTION_IDS.filter((id) => !seen.has(id))
  );

  const hidden = new Set<TodaySectionId>(
    (raw?.hidden ?? []).filter(
      (id): id is TodaySectionId =>
        canonical.has(id) && !NON_HIDEABLE_TODAY_IDS.has(id as TodaySectionId)
    )
  );
  return { order, rail, hidden };
}

const DEBOUNCE_MS = 600;

export function useTodayLayout() {
  const { data } = useQuery<{ todayLayout: LayoutPayload }>(TODAY_LAYOUT_QUERY, {
    fetchPolicy: "cache-first",
  });
  const [updateMutation] = useMutation(UPDATE_TODAY_LAYOUT);
  const [resetMutation] = useMutation(RESET_TODAY_LAYOUT);

  const serverState = useMemo(() => reconcileLayout(data?.todayLayout), [data]);

  // Local optimistic state — updates instantly; debounced flush hits server.
  const [order, setOrder] = useState<TodaySectionId[]>(serverState.order);
  const [rail, setRail] = useState<TodaySectionId[]>(serverState.rail);
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
    setRail(serverState.rail);
    setHidden(serverState.hidden);
    initializedRef.current = true;
  }, [data, serverState.order, serverState.rail, serverState.hidden]);

  // Debounced flush. Writes the new layout to both the server and Apollo
  // cache so the next query read matches the optimistic UI.
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(
    (
      nextOrder: TodaySectionId[],
      nextHidden: Set<TodaySectionId>,
      nextRail: TodaySectionId[]
    ) => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      const hiddenArr = Array.from(nextHidden);
      pendingTimerRef.current = setTimeout(() => {
        updateMutation({
          variables: { order: nextOrder, hidden: hiddenArr, rail: nextRail },
          optimisticResponse: {
            updateTodayLayout: {
              __typename: "TodayLayout",
              order: nextOrder,
              hidden: hiddenArr,
              rail: nextRail,
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
          setRail(serverState.rail);
          setHidden(serverState.hidden);
        });
      }, DEBOUNCE_MS);
    },
    [updateMutation, serverState.order, serverState.rail, serverState.hidden]
  );

  const toggleVisibility = useCallback(
    (id: TodaySectionId) => {
      if (NON_HIDEABLE_TODAY_IDS.has(id)) return;
      setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        flush(order, next, rail);
        return next;
      });
    },
    [flush, order, rail]
  );

  /**
   * Mueve una sección a la posición `toIndex` de la columna `toColumn`.
   *
   * Es la única primitiva de reordenado: mover dentro de una columna y mover
   * entre columnas son el mismo gesto, así que son la misma función. Tener dos
   * (`reorder` y `moveToColumn`) obligaba a decidir cuál llamar en cada drop y
   * a mantener dos veces la misma aritmética de índices.
   */
  const moveSection = useCallback(
    (id: TodaySectionId, toColumn: TodayColumn, toIndex: number) => {
      const nextOrder = order.filter((x) => x !== id);
      const nextRail = rail.filter((x) => x !== id);
      const target = toColumn === "rail" ? nextRail : nextOrder;
      const clamped = Math.max(0, Math.min(toIndex, target.length));
      target.splice(clamped, 0, id);

      setOrder(nextOrder);
      setRail(nextRail);
      flush(nextOrder, hidden, nextRail);
    },
    [flush, order, rail, hidden]
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
      const next = reconcileLayout(payload ?? undefined);
      setOrder(next.order);
      setRail(next.rail);
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
      variables: { order, hidden: Array.from(hidden), rail },
    }).catch(() => undefined);
  }, [updateMutation, order, hidden, rail]);

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  return {
    order,
    rail,
    hidden,
    editMode,
    setEditMode,
    toggleVisibility,
    moveSection,
    reset,
    flushNow,
    isVisible: (id: TodaySectionId) => !hidden.has(id),
    columnOf: (id: TodaySectionId): TodayColumn =>
      rail.includes(id) ? "rail" : "main",
  };
}

export type UseTodayLayoutReturn = ReturnType<typeof useTodayLayout>;
