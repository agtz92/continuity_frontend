/**
 * Después de escribir: caché + delta, no el dashboard entero.
 *
 * **Antes.** Casi cada mutation llevaba `refetchQueries: [DASHBOARD_QUERY]`:
 * palomear una tarea volvía a bajar todas las tareas, ideas, notas, rutinas y
 * 60 días de activities (~10 consultas en el servidor, ~1,3 s en la cuenta más
 * grande). Con muchos usuarios a la vez esa descarga es lo que tumbó el backend
 * en la prueba de estrés del 2026-11-06.
 *
 * **Ahora.**
 * 1. Apollo funde por `id` lo que devuelve la mutation (las ediciones ya se
 *    pintaban así). Lo creado se mete en su lista (`insertAfter`) y lo borrado
 *    se saca (`removeAfter`).
 * 2. Lo que **deriva el servidor** —campos de los proyectos (enfriamiento,
 *    atorado, `lastActivity`) y las activities que registró— llega con
 *    `dashboardDelta`, agrupado: varias escrituras seguidas = un delta.
 * 3. Si el delta falla (red, backend sin `dashboardDelta`) se hace el refetch
 *    completo de antes.
 *
 * **Lo que sigue usando refetch completo** (`fullRefetchAfter`): borrados con
 * cascada (proyecto, tarea, rutina, categoría), blockers, restaurar fechas,
 * promover idea. Son raros y la caché no conoce sus efectos.
 *
 * Espejo de `continuity-mobile/src/lib/dashboardDelta.ts`.
 */
import type { ApolloCache, FetchResult } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { DASHBOARD_DELTA_QUERY, DASHBOARD_QUERY } from "@/lib/graphql";
import { insertIntoDashboard, type DashboardList } from "@/lib/captureCache";

type Row = Record<string, unknown> & { id: string };
type DashboardShape = { dashboard?: Record<string, unknown> } | null | undefined;
interface Delta {
  projects: Row[];
  activities: Row[];
}

/** Para lo raro: borrados con cascada, blockers, operaciones masivas. */
export const fullRefetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

// ---- Funciones puras (tienen tests) ----------------------------------------

/** El dashboard sin el `id` en `list`, o `undefined` si no hay nada que quitar. */
export function removeFromDashboard<T extends DashboardShape>(
  previous: T,
  list: DashboardList,
  id: string | null | undefined
): T | undefined {
  const dash = previous?.dashboard;
  const current = dash?.[list];
  if (!dash || !id || !Array.isArray(current)) return undefined;
  const next = current.filter((item) => (item as Row | null)?.id !== id);
  if (next.length === current.length) return undefined;
  return { ...previous, dashboard: { ...dash, [list]: next } } as T;
}

// Margen sobre la activity más nueva cacheada; lo repetido se descarta por id.
const SINCE_MARGIN_MS = 5 * 60_000;
const SINCE_FALLBACK_MS = 60 * 60_000;

/** Desde cuándo pedir activities, según lo que ya hay en caché. */
export function deltaSince(
  activities: Array<{ created?: string }> | undefined,
  now = Date.now()
): string {
  let newest = 0;
  for (const a of activities ?? []) {
    const t = a?.created ? Date.parse(a.created) : NaN;
    if (Number.isFinite(t) && t > newest) newest = t;
  }
  return new Date(newest ? newest - SINCE_MARGIN_MS : now - SINCE_FALLBACK_MS).toISOString();
}

/** Proyectos reemplazados (el delta los trae todos) y activities nuevas al frente. */
export function mergeDelta<T extends DashboardShape>(previous: T, delta: Delta): T | undefined {
  const dash = previous?.dashboard;
  if (!dash || !Array.isArray(dash.activities)) return undefined;
  const current = dash.activities as Row[];
  const known = new Set(current.map((a) => a?.id));
  const fresh = delta.activities.filter((a) => !known.has(a.id));
  return {
    ...previous,
    dashboard: {
      ...dash,
      projects: delta.projects,
      activities: fresh.length ? [...fresh, ...current] : current,
    },
  } as T;
}

// ---- Reconciliación ----------------------------------------------------------

const DEBOUNCE_MS = 700;
let timer: ReturnType<typeof setTimeout> | undefined;

async function runDelta(): Promise<void> {
  const cache = apolloClient.cache;
  const cached = cache.readQuery({ query: DASHBOARD_QUERY }) as DashboardShape;
  const activities = cached?.dashboard?.activities as Array<{ created?: string }> | undefined;
  if (!cached?.dashboard || !activities) return; // Nada cacheado: lo pide la query.
  try {
    const res = await apolloClient.query<{ dashboardDelta: Delta }>({
      query: DASHBOARD_DELTA_QUERY,
      variables: { since: deltaSince(activities) },
      fetchPolicy: "no-cache",
      errorPolicy: "none",
      context: { silent: true },
    });
    const delta = res.data?.dashboardDelta;
    if (!delta) throw new Error("empty delta");
    cache.updateQuery({ query: DASHBOARD_QUERY }, (prev) => mergeDelta(prev as DashboardShape, delta));
  } catch {
    await apolloClient.refetchQueries({ include: [DASHBOARD_QUERY] });
  }
}

/** Agenda un delta; las escrituras seguidas se juntan en uno. */
export function scheduleDashboardDelta(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    void runDelta();
  }, DEBOUNCE_MS);
}

// ---- Opciones de `useMutation` ---------------------------------------------

/** Ediciones: Apollo ya funde la respuesta por id; falta el delta. */
export const syncAfter = { onCompleted: () => scheduleDashboardDelta() };

/** Creaciones: mete el objeto devuelto en `list` y agenda el delta. */
export function insertAfter(list: DashboardList, field: string) {
  return {
    update(cache: ApolloCache<unknown>, result: FetchResult<Record<string, unknown>>) {
      const created = result.data?.[field] as Row | undefined;
      cache.updateQuery({ query: DASHBOARD_QUERY }, (prev) =>
        insertIntoDashboard(prev as DashboardShape, list, created)
      );
    },
    onCompleted: () => scheduleDashboardDelta(),
  };
}

/** Borrados sin cascada: saca el `id` (variable `idVar`) de `list`. */
export function removeAfter(list: DashboardList, idVar = "id") {
  return {
    update(
      cache: ApolloCache<unknown>,
      result: FetchResult<Record<string, unknown>>,
      { variables }: { variables?: Record<string, unknown> }
    ) {
      if (result.errors?.length) return;
      const id = variables?.[idVar] as string | undefined;
      cache.updateQuery({ query: DASHBOARD_QUERY }, (prev) =>
        removeFromDashboard(prev as DashboardShape, list, id)
      );
    },
    onCompleted: () => scheduleDashboardDelta(),
  };
}

/** ¿Alguna tarea cacheada tiene a `taskId` como bloqueador? (completarla los borra). */
export function blocksOtherTasks(taskId: string): boolean {
  const cached = apolloClient.cache.readQuery({ query: DASHBOARD_QUERY }) as DashboardShape;
  const tasks = (cached?.dashboard?.tasks ?? []) as Array<{
    blockers?: Array<{ blockingTaskId?: string | null }>;
  }>;
  return tasks.some((t) => t.blockers?.some((b) => b.blockingTaskId === taskId));
}
