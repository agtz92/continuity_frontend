"use client";

import { useTranslations } from "next-intl";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

export default function FinalCall() {
  const t = useTranslations("landing.finalCall");

  return (
    <SectionContainer id="final-call" surface="navy">
      <div className="max-w-4xl mx-auto text-center relative">
        {/* Glow — radial-gradient instead of a blur() filter (cheap to paint). */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(700px 500px at 50% 50%, color-mix(in srgb, var(--ls-ochre) 10%, transparent), transparent 70%)",
          }}
        />

        <AnimatedHeadline
          text={t("headlineLine1")}
          className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />
        <div className="h-4" />
        <AnimatedHeadline
          text={t("headlineLine2")}
          className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-ochre"
        />

        <div className="mt-12 space-y-5 text-lg text-ls-text-secondary leading-relaxed max-w-2xl mx-auto">
          {(["p1", "p2", "p3", "p4", "p5", "p6"] as const).map((key) => (
            <p
              key={key}
              className={`ls-reveal ${
                key === "p3" || key === "p4"
                  ? "font-display text-2xl sm:text-3xl text-ls-text-primary"
                  : key === "p6"
                    ? "text-ls-text-primary font-medium"
                    : ""
              }`}
            >
              {t(key)}
            </p>
          ))}
        </div>

        <div className="ls-reveal mt-16 flex flex-col items-center gap-3">
          <CTAButton href="#beta" variant="primary" size="lg">
            {t("cta")}
          </CTAButton>
          <p className="text-sm text-ls-text-secondary">{t("subCta")}</p>
        </div>

        <p className="ls-reveal mt-24 font-display text-3xl sm:text-4xl text-ls-ochre italic">
          {t("tagline")}
        </p>
      </div>
    </SectionContainer>
  );
}
