import { fetchBetaProgram, fetchPlatformStats } from "@/lib/publicGraphql";
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

export default async function Landing() {
  // Both cached on the same 10-minute window as the rest of marketing, so
  // closing enrolment in /admin/beta reaches the landing without a deploy.
  // Awaited one after the other rather than in parallel because the section
  // component imported below is *called* `Promise` and shadows the global.
  const stats = await fetchPlatformStats();
  const beta = await fetchBetaProgram();

  return (
    <div
      id="top"
      data-surface="marketing"
      className="min-h-screen bg-ls-navy text-ls-text-primary font-sans antialiased selection:bg-ls-ochre/30 selection:text-ls-text-primary"
    >
      <LenisProvider />
      <MarketingNav beta={beta} />
      <main>
        <Hero beta={beta} />
        <Recognition />
        <Diagnosis />
        <Promise beta={beta} />
        <Features />
        <LoopSociety />
        <HowItWorks beta={beta} />
        {/* The whole section goes when the beta does — every CTA that
            pointed at it falls back to #pricing. */}
        {beta.enrollmentOpen ? (
          <BetaProgram userCount={stats.userCount} />
        ) : null}
        <Pricing beta={beta} />
        <FinalCall beta={beta} />
      </main>
      <MarketingFooter />
    </div>
  );
}
