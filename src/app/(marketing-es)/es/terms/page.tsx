import type { Metadata } from "next";
import LegalPage, { legalMetadata } from "@/components/marketing/LegalPage";

export const metadata: Metadata = legalMetadata("es", "terms");

export default function Page() {
  return <LegalPage locale="es" kind="terms" />;
}
