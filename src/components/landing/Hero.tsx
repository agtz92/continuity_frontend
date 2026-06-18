"use client";

import { useTranslations } from "next-intl";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

export default function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <SectionContainer surface="navy" className="min-h-[100svh] flex items-center">
      <div className="relative flex flex-col items-center text-center pt-24 sm:pt-32">
        {/* Background glow — radial-gradients instead of huge blur() filters,
            which are a major scroll-repaint cost on mobile Safari. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 600px at 50% 33%, color-mix(in srgb, var(--ls-ochre) 10%, transparent), transparent 70%), radial-gradient(600px 400px at 33% 66%, color-mix(in srgb, var(--ls-vermillion) 10%, transparent), transparent 70%)",
          }}
        />

        <p className="ls-fade-up ls-fade-up-1 mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-ls-text-secondary backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ls-ochre opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ls-ochre" />
          </span>
          {t("eyebrow")}
        </p>

        <AnimatedHeadline
          as="h1"
          reveal="load"
          text={t("headline")}
          className="font-display text-[clamp(3rem,9vw,7rem)] leading-[0.95] tracking-tight font-light text-ls-text-primary max-w-[18ch]"
        />

        <p className="ls-fade-up ls-fade-up-2 mt-8 max-w-2xl text-base sm:text-lg text-ls-text-secondary leading-relaxed">
          {t("subheadline")}
        </p>

        <div className="ls-fade-up ls-fade-up-3 mt-10 flex flex-col items-center gap-3">
          <CTAButton href="#beta" variant="primary" size="lg">
            {t("ctaPrimary")}
          </CTAButton>
          <p className="text-xs text-ls-text-secondary/80">{t("ctaSecondary")}</p>
        </div>

        {/* Scroll hint */}
        <div className="ls-fade-up ls-fade-up-3 mt-24 sm:mt-32 flex flex-col items-center gap-3 text-xs uppercase tracking-[0.2em] text-ls-text-secondary/70">
          {t("scrollHint")}
          <span
            aria-hidden="true"
            className="ls-float block h-8 w-px bg-gradient-to-b from-ls-text-secondary/70 to-transparent"
          />
        </div>
      </div>
    </SectionContainer>
  );
}
