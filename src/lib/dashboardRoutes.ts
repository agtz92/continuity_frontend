import type { DashboardView } from "@/lib/dashboardViews";

/**
 * URLs reales para el dashboard (DP-06).
 *
 * Hasta aquí el dashboard era **una sola URL** con diez vistas conmutadas por
 * `useState`: no se podía compartir un enlace, recargar dejaba siempre en
 * "Hoy", y el botón atrás salía de la app.
 *
 * **Por qué una ruta catch-all y no diez rutas.** `Dashboard.tsx` es dueño de
 * la query del dashboard, de ~25 estados de modal y del estado de vista, todo
 * compartido por las diez vistas. Con diez `page.tsx` distintas, cada
 * navegación desmonta y remonta ese árbol: se pierden filtros, búsquedas y
 * scroll, y la query se vuelve a lanzar. Con un `[[...slug]]` la URL es igual
 * de real —se comparte, se recarga, el atrás funciona— pero el componente es
 * el mismo en cada navegación, así que **no se pierde nada**.
 *
 * El precio: no hay code-splitting por vista. Se paga cuando `Dashboard.tsx`
 * deje de ser dueño de todo, no antes.
 */

/** Vista → primer segmento. "today" es la raíz y no lleva segmento. */
const SEGMENT: Record<DashboardView, string> = {
  today: "",
  projects: "projects",
  tasks: "tasks",
  routines: "routines",
  calendar: "calendar",
  ideas: "ideas",
  notes: "notes",
  log: "log",
  analytics: "analytics",
  graveyard: "graveyard",
};

const BY_SEGMENT = new Map<string, DashboardView>(
  Object.entries(SEGMENT).map(([view, seg]) => [seg, view as DashboardView])
);

export const DASHBOARD_ROOT = "/dashboard";

export interface DashboardRoute {
  view: DashboardView;
  /** Detalle de proyecto abierto: `/dashboard/projects/<id>`. */
  projectId: string | null;
}

/**
 * Segmentos de la URL → estado del dashboard. Un segmento desconocido cae en
 * "Hoy" en vez de romper: un enlace viejo o mal escrito debe entrar a la app,
 * no dar 404 dentro de ella.
 */
export function parseDashboardRoute(
  slug: string[] | undefined
): DashboardRoute {
  const [first, second] = slug ?? [];
  const view = BY_SEGMENT.get(first ?? "") ?? "today";
  return {
    view,
    projectId: view === "projects" && second ? second : null,
  };
}

/** Estado del dashboard → URL. La inversa exacta de `parseDashboardRoute`. */
export function dashboardHref(
  view: DashboardView,
  projectId?: string | null
): string {
  const seg = SEGMENT[view];
  if (!seg) return DASHBOARD_ROOT;
  if (view === "projects" && projectId) {
    return `${DASHBOARD_ROOT}/${seg}/${projectId}`;
  }
  return `${DASHBOARD_ROOT}/${seg}`;
}
