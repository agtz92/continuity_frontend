import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import DashboardGate from "@/components/DashboardGate";

/**
 * El dashboard vive en el **layout**, no en la página, y esto no es un detalle
 * de organización: es la razón de que las rutas nuevas no rompan nada.
 *
 * Comprobado en el navegador antes de escribirlo: al cambiar el parámetro de un
 * catch-all, Next **remonta la página** (el estado se pierde, la query se
 * relanza) pero **no el layout** — ahí `usePathname()` se actualiza sin
 * desmontar nada. Como `Dashboard.tsx` es dueño de la query del dashboard, de
 * ~25 estados de modal y del estado de cada vista, montarlo aquí es lo que
 * hace que navegar entre `/dashboard/tasks` y `/dashboard/projects` conserve
 * filtros, búsquedas y scroll, igual que cuando eran pestañas.
 *
 * La página (`[[...slug]]/page.tsx`) no pinta nada: existe solo para que las
 * URLs resuelvan. Quien decide qué vista se ve es `Dashboard`, leyendo el
 * pathname.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <DashboardGate initialSession={session}>{children}</DashboardGate>;
}
