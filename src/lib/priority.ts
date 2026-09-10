import type { Priority } from "@/lib/types";

/**
 * Prioridad como señal, no como semáforo.
 *
 * Antes esto eran colores fijos de Tailwind (rojo/naranja/esmeralda/azul) con
 * variante `dark:`. El rediseño lo reduce a la escala del sistema: solo la
 * crítica y la alta tienen tinta propia (`--signal` y el acento); media y baja
 * se dicen con el peso de la regla. Cuatro colores saturados en una lista de
 * catorce proyectos no jerarquizan nada.
 *
 * El orden de intensidad es el mismo que usa `<Spine>`, a propósito: la barra
 * de la fila y el chip del detalle tienen que decir lo mismo.
 */
export const priorityChipClass: Record<Priority, string> = {
  critical: "bg-signal-a12 text-signal border-signal-a50",
  high: "bg-accent-a12 text-accent border-accent-a35",
  medium: "bg-line-06 text-text-3 border-line-22",
  low: "bg-line-04 text-text-4 border-line-14",
};

/**
 * Punto de prioridad para selectores y tarjetas. Es el mismo relleno que pinta
 * `<Spine>`; si cambias uno, cambia el otro (`PRIORITY_FILL` en Spine.tsx).
 */
export const priorityDotClass: Record<Priority, string> = {
  critical: "bg-signal",
  high: "bg-accent",
  medium: "bg-line-34",
  low: "bg-line-22",
};

export const PRIORITY_FILTER_ORDER: Array<"all" | Priority> = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
];

export type ProjectSortMode =
  | "smart"
  | "manual"
  | "priority"
  | "recent"
  /** "Frío primero": lo que lleva más tiempo sin tocarse arriba. Es el inverso
   *  de `recent` y el orden que el rediseño quiere como opción de primera
   *  (artboard 02: "el orden 'frío primero' es una opción real"). */
  | "cold"
  /** Agrupado por categoría, con línea de diagnóstico por grupo (S02b). Sin esa
   *  línea, agrupar solo reordena — el canvas es explícito. */
  | "category"
  | "name"
  | "status";

export const PROJECT_SORT_MODES: ProjectSortMode[] = [
  "smart",
  "cold",
  "category",
  "manual",
  "priority",
  "recent",
  "name",
  "status",
];
