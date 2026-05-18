import { getServerSession } from "@/lib/supabase-server";
import DashboardGate from "@/components/DashboardGate";
import Landing from "@/components/landing/Landing";

export default async function Home() {
  const session = await getServerSession();
  if (!session) return <Landing />;
  return <DashboardGate initialSession={session} />;
}
