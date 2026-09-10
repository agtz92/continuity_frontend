/**
 * Página vacía a propósito. Todas las vistas del dashboard cuelgan de esta
 * ruta (`/dashboard`, `/dashboard/tasks`, `/dashboard/projects/<id>`…), pero
 * quien las pinta es `Dashboard`, montado en el layout de arriba: así navegar
 * no desmonta el árbol ni relanza la query. Aquí solo se declara que la URL
 * existe. El porqué, en `lib/dashboardRoutes.ts`.
 */
export default function DashboardPage() {
  return null;
}
