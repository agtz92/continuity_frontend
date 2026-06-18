"use client";

import { useTranslations } from "next-intl";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";

const STAT_KEYS = ["one", "two", "three", "four"] as const;

function StatCard({ slug }: { slug: (typeof STAT_KEYS)[number] }) {
  const t = useTranslations(`landing.loopSociety.stats.${slug}`);

  return (
    <div className="ls-reveal relative rounded-2xl border border-ls-text-on-cream/15 bg-white/40 backdrop-blur-sm p-8 sm:p-10">
      <p className="font-display text-6xl sm:text-7xl leading-none tracking-tight text-ls-text-on-cream">
        {t("value")}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ls-vermillion">
        {t("label")}
      </p>
      <p className="mt-5 text-base text-ls-text-on-cream leading-relaxed">
        {t("body")}
      </p>
    </div>
  );
}

export default function LoopSociety() {
  const t = useTranslations("landing.loopSociety");

  return (
    <SectionContainer id="loop-society" surface="cream">
      <div className="max-w-3xl mx-auto text-center">
        <p className="ls-reveal mb-5 inline-block text-xs font-medium uppercase tracking-[0.2em] text-ls-vermillion">
          {t("eyebrow")}
        </p>
        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight font-light text-ls-text-on-cream"
        />
        <p className="ls-reveal mt-6 font-display text-xl sm:text-2xl text-ls-text-on-cream leading-snug max-w-xl mx-auto">
          {t("subheadline")}
        </p>
        <p className="ls-reveal mt-6 text-base text-ls-text-on-cream-muted leading-relaxed max-w-2xl mx-auto">
          {t("body")}
        </p>
      </div>

      <div className="mt-20 grid sm:grid-cols-2 gap-5">
        {STAT_KEYS.map((slug) => (
          <StatCard key={slug} slug={slug} />
        ))}
      </div>
    </SectionContainer>
  );
}
