import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { fetchPlatformStats } from "@/lib/publicGraphql";
import LenisProvider from "./primitives/LenisProvider";
import MarketingNav from "./MarketingNav";
import Hero from "./Hero";
import Recognition from "./Recognition";
import Diagnosis from "./Diagnosis";
import Promise from "./Promise";
import Features from "./Features/FeaturesSection";
import LoopSociety from "./LoopSociety";
import HowItWorks from "./HowItWorks";
import BetaProgram from "./BetaProgram";
import Pricing from "./Pricing";
import FinalCall from "./FinalCall";
import MarketingFooter from "./MarketingFooter";

export async function generateLandingMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Landing() {
  const stats = await fetchPlatformStats();

  return (
    <div
      id="top"
      data-surface="marketing"
      className="min-h-screen bg-ls-navy text-ls-text-primary font-sans antialiased selection:bg-ls-ochre/30 selection:text-ls-text-primary"
    >
      <LenisProvider />
      <MarketingNav />
      <main>
        <Hero />
        <Recognition />
        <Diagnosis />
        <Promise />
        <Features />
        <LoopSociety />
        <HowItWorks />
        <BetaProgram userCount={stats.userCount} />
        <Pricing />
        <FinalCall />
      </main>
      <MarketingFooter />
    </div>
  );
}
