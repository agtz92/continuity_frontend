import type { DashboardView } from "@/lib/dashboardViews";

/**
 * El guion del tour. **Esto es lo único que se edita para cambiarlo.**
 *
 * Cada paso es una fila de datos, no un componente. El overlay no sabe qué
 * dice ningún paso ni a qué apunta: lee esta lista, resuelve el texto por
 * convención (`onboarding.tour.<key>.title` / `.body`) y mide el ancla.
 *
 * Gemelo de `continuity-mobile/src/components/onboarding/tour/steps.ts`. Las
 * dos listas llevan **las mismas claves en el mismo orden**, porque los textos
 * son los mismos: si aquí se añade una sección, allá también.
 *
 * Añadir una sección al tour, entero:
 *
 *   1. una entrada aquí,
 *   2. `onboarding.tour.<key>.title` y `.body` en `messages/en.json` y
 *      `es.json`,
 *   3. si el sitio al que apunta no es una entrada de la barra lateral,
 *      ponerle `data-tour="…"`.
 *
 * No hay paso 4. Los puntos de progreso, el numeral de la ficha y el botón
 * final salen todos de `TOUR_STEPS.length`.
 *
 * Detalle largo: `../continuity-mobile/docs/onboarding-tour.md`.
 */
export type TourStep = {
  /**
   * Identifica el paso y **es** su clave de i18n. Sin mapa intermedio: si el
   * texto falta, el fallo se ve en la primera pasada.
   */
  key: string;
  /**
   * La vista a la que se cambia antes de medir. Así el usuario ve **la
   * sección de verdad** detrás del velo, no una descripción de ella.
   */
  view?: DashboardView;
  /**
   * `data-tour` del elemento sobre el que se recorta el agujero. Sin ancla, el
   * paso va a pantalla completa (la bienvenida y el cierre) — y si el ancla no
   * está en el DOM (la barra inferior del móvil no lleva todas las entradas),
   * el paso cae a pantalla completa solo, sin romperse.
   */
  anchor?: string;
};

/**
 * Nueve secciones en diez pasos, en el orden de la barra lateral.
 *
 * `log` no tiene paso propio a propósito: es la única vista que se explica
 * sola al verla. Se menciona dentro de `analytics`.
 */
export const TOUR_STEPS: TourStep[] = [
  // El saludo ocurre **sobre Today**, la vista en la que el usuario ya está.
  // Así entra en el tour sin gastar un paso, y el tour empieza situando en vez
  // de interrumpiendo.
  { key: "welcome", view: "today" },
  { key: "projects", view: "projects", anchor: "projects" },
  { key: "tasks", view: "tasks", anchor: "tasks" },
  { key: "routines", view: "routines", anchor: "routines" },
  { key: "calendar", view: "calendar", anchor: "calendar" },
  { key: "ideas", view: "ideas", anchor: "ideas" },
  { key: "notes", view: "notes", anchor: "notes" },
  { key: "graveyard", view: "graveyard", anchor: "graveyard" },
  { key: "analytics", view: "analytics", anchor: "analytics" },
  { key: "close", view: "today" },
];
