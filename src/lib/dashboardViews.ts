/**
 * Los diez destinos del dashboard.
 *
 * Vivían en `dashboard/TabBar.tsx`, que la ola 4 eliminó al sustituir las
 * pestañas horizontales por la barra lateral. El tipo se mudó aquí porque lo
 * necesitan cosas que no son navegación (el mapa de rutas, el estado de vista),
 * y colgarlo de un componente concreto ataba todo eso a ese componente.
 */
export type DashboardView =
  | "today"
  | "projects"
  | "tasks"
  | "routines"
  | "calendar"
  | "ideas"
  | "notes"
  | "log"
  | "analytics"
  | "graveyard";
