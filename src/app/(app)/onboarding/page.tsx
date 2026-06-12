import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { OnboardingFlow } from "./OnboardingFlow";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const sp = await searchParams;
  const replay = sp?.replay === "true";
  return <OnboardingFlow replay={replay} />;
}
