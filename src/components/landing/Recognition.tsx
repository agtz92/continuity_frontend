"use client";

import { useTranslations } from "next-intl";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";

export default function Recognition() {
  const t = useTranslations("landing.recognition");

  return (
    <SectionContainer id="recognition" surface="navy">
      <div className="max-w-3xl">
        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />

        <div className="mt-10 space-y-5 text-lg text-ls-text-secondary leading-relaxed">
          {(["p1", "p2", "p3"] as const).map((key) => (
            <p key={key} className="ls-reveal">
              {t(key)}
            </p>
          ))}
          <p className="ls-reveal text-ls-text-primary">{t("p4")}</p>
          <p className="ls-reveal font-medium text-ls-ochre">{t("p5")}</p>
        </div>

        <figure className="ls-reveal mt-12 border-l-2 border-ls-ochre/60 pl-6">
          <blockquote className="font-display text-xl sm:text-2xl text-ls-text-primary italic leading-snug">
            &ldquo;{t("callout")}&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-sm text-ls-text-secondary">
            — {t("calloutAuthor")}
          </figcaption>
        </figure>
      </div>
    </SectionContainer>
  );
}
