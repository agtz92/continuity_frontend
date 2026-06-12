import type { Metadata } from "next";
import LegalPage, { legalMetadata } from "@/components/marketing/LegalPage";

export const metadata: Metadata = legalMetadata("es", "privacy");

export default function Page() {
  return <LegalPage locale="es" kind="privacy" />;
}
