"use client";

import { useTranslations } from "next-intl";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

type Step = { title: string; body: string };

export default function HowItWorks() {
  const t = useTranslations("landing.howItWorks");
  const steps = t.raw("steps") as Step[];

  return (
    <SectionContainer id="how-it-works" surface="navy">
      <div className="max-w-2xl mx-auto text-center mb-20">
        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div
            key={i}
            className="ls-reveal relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-ls-ochre/30 transition-colors"
          >
            <span className="font-display text-7xl font-light text-ls-ochre/40 leading-none">
              0{i + 1}
            </span>
            <h3 className="mt-6 font-display text-xl text-ls-text-primary leading-snug">
              {step.title}
            </h3>
            <p className="mt-4 text-base text-ls-text-secondary leading-relaxed">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      <div className="ls-reveal mt-16 text-center">
        <CTAButton href="#beta" variant="primary" size="lg">
          {t("cta")}
        </CTAButton>
      </div>
    </SectionContainer>
  );
}
