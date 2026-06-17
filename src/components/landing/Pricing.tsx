"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

type TierKey = "free" | "pro" | "studio";
type Period = "monthly" | "annual";

function PricingCard({
  tierKey,
  popular,
  period,
}: {
  tierKey: TierKey;
  popular?: boolean;
  period: Period;
}) {
  const t = useTranslations(`landing.pricing.tiers.${tierKey}`);
  const tCommon = useTranslations("landing.pricing");
  const perks = t.raw("perks") as string[];

  const isPaid = tierKey !== "free";
  const price = isPaid && period === "annual" ? t("priceAnnual") : t("price");
  const cadence =
    isPaid && period === "annual" ? t("priceCadenceAnnual") : t("priceCadence");

  // Free → signup; paid → login that redirects to billing with the upgrade
  // pre-selected so checkout fires automatically once the user has a session.
  const ctaHref =
    tierKey === "free"
      ? "/login"
      : `/login?next=${encodeURIComponent(
          `/settings/billing?upgrade=${tierKey}&period=${period}`
        )}`;

  return (
    <div
      className={`ls-reveal relative rounded-3xl border p-8 flex flex-col transition-transform duration-200 motion-safe:hover:-translate-y-1.5 ${
        popular
          ? "border-ls-ochre/50 bg-gradient-to-b from-ls-ochre/10 to-transparent shadow-[0_30px_80px_-30px_rgba(212,168,71,0.4)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {popular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ls-ochre text-ls-navy px-3 py-1 text-xs font-medium uppercase tracking-wider">
          {tCommon("popular")}
        </span>
      ) : null}

      <h3 className="font-display text-2xl text-ls-text-primary">{t("name")}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-4xl text-ls-text-primary">
          {price}
        </span>
        <span className="text-sm text-ls-text-secondary">{cadence}</span>
      </div>

      {isPaid ? (
        <p className="mt-4 text-sm text-ls-text-secondary">
          {t("inheritsFrom")}
        </p>
      ) : null}

      <ul className="mt-6 space-y-2.5 flex-1">
        {perks.map((p) => (
          <li
            key={p}
            className="flex items-start gap-2.5 text-sm text-ls-text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="mt-0.5 h-4 w-4 text-ls-ochre shrink-0"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <CTAButton
          href={ctaHref}
          variant={popular ? "primary" : "ghost"}
          size="md"
          className="w-full"
        >
          {t("cta")}
        </CTAButton>
      </div>
    </div>
  );
}

function BillingToggle({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  const t = useTranslations("landing.pricing.billingToggle");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
            period === "monthly"
              ? "bg-ls-ochre text-ls-navy font-medium"
              : "text-ls-text-secondary hover:text-ls-text-primary"
          }`}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
            period === "annual"
              ? "bg-ls-ochre text-ls-navy font-medium"
              : "text-ls-text-secondary hover:text-ls-text-primary"
          }`}
        >
          {t("annual")}
        </button>
      </div>
      {period === "annual" ? (
        <span className="text-xs text-ls-ochre">{t("annualHint")}</span>
      ) : (
        <span className="text-xs text-transparent select-none">.</span>
      )}
    </div>
  );
}

export default function Pricing() {
  const t = useTranslations("landing.pricing");
  const [period, setPeriod] = useState<Period>("annual");

  return (
    <SectionContainer id="pricing" surface="navy">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />
        <p className="ls-reveal mt-5 text-lg text-ls-ochre">
          {t("subheadline")}
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <BillingToggle period={period} onChange={setPeriod} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        <PricingCard tierKey="free" period={period} />
        <PricingCard tierKey="pro" popular period={period} />
        <PricingCard tierKey="studio" period={period} />
      </div>

      <div className="ls-reveal mt-16 mx-auto max-w-2xl rounded-2xl border border-ls-ochre/30 bg-gradient-to-r from-ls-ochre/10 via-ls-vermillion/10 to-ls-ochre/10 p-6 text-center">
        <p className="text-base text-ls-text-primary leading-relaxed">
          {t("betaBanner")}
        </p>
        <div className="mt-5">
          <CTAButton href="#beta" variant="primary" size="md">
            {t("betaCta")}
          </CTAButton>
        </div>
      </div>
    </SectionContainer>
  );
}
