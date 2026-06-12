import type { Metadata } from "next";
import LandingPage, { landingMetadata } from "@/components/marketing/LandingPage";

export const metadata: Metadata = landingMetadata("es");

export default function Page() {
  return <LandingPage locale="es" redirectIfAuthed />;
}
