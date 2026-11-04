import type { Metadata } from "next";
import PricingPage, { pricingMetadata } from "@/components/marketing/PricingPage";

export const metadata: Metadata = pricingMetadata("es");

export default function Page() {
  return <PricingPage locale="es" />;
}
