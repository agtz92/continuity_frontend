import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import Landing from "@/components/landing/Landing";

export default async function Home() {
  const session = await getServerSession();
  if (session) redirect("/dashboard");
  return <Landing />;
}
