import type { Metadata } from "next";
import LegalPage, { legalMetadata } from "@/components/marketing/LegalPage";

export const metadata: Metadata = legalMetadata("en", "support");

export default function Page() {
  return <LegalPage locale="en" kind="support" />;
}
