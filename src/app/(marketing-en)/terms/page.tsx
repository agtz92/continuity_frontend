import type { Metadata } from "next";
import LegalPage, { legalMetadata } from "@/components/marketing/LegalPage";

export const metadata: Metadata = legalMetadata("en", "terms");

export default function Page() {
  return <LegalPage locale="en" kind="terms" />;
}
