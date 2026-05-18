"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

type TierKey = "starter" | "pro" | "together";

function PricingCard({
  tierKey,
  popular,
  index,
}: {
  tierKey: TierKey;
  popular?: boolean;
  index: number;
}) {
  const t = useTranslations(`landing.pricing.tiers.${tierKey}`);
  const tCommon = useTranslations("landing.pricing");
  const perks = t.raw("perks") as string[];

  const hasInherits = tierKey !== "starter";
  const hasCadence = tierKey !== "starter";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className={`relative rounded-3xl border p-8 flex flex-col ${
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
          {t("price")}
        </span>
        {hasCadence ? (
          <span className="text-sm text-ls-text-secondary">
            {t("priceCadence")}
          </span>
        ) : null}
      </div>

      {hasInherits ? (
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
          href="#beta"
          variant={popular ? "primary" : "ghost"}
          size="md"
          className="w-full"
        >
          {t("cta")}
        </CTAButton>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const t = useTranslations("landing.pricing");

  return (
    <SectionContainer id="pricing" surface="navy">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5 text-lg text-ls-ochre"
        >
          {t("subheadline")}
        </motion.p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        <PricingCard tierKey="starter" index={0} />
        <PricingCard tierKey="pro" popular index={1} />
        <PricingCard tierKey="together" index={2} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-16 mx-auto max-w-2xl rounded-2xl border border-ls-ochre/30 bg-gradient-to-r from-ls-ochre/10 via-ls-vermillion/10 to-ls-ochre/10 p-6 text-center"
      >
        <p className="text-base text-ls-text-primary leading-relaxed">
          🎁 {t("betaBanner")}
        </p>
        <div className="mt-5">
          <CTAButton href="#beta" variant="primary" size="md">
            {t("betaCta")}
          </CTAButton>
        </div>
      </motion.div>
    </SectionContainer>
  );
}
