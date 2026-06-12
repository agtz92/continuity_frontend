import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import DashboardGate from "@/components/DashboardGate";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <DashboardGate initialSession={session} />;
}
