"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";

const STAT_KEYS = ["one", "two", "three", "four"] as const;

function StatCard({
  index,
  slug,
}: {
  index: number;
  slug: (typeof STAT_KEYS)[number];
}) {
  const t = useTranslations(`landing.loopSociety.stats.${slug}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl border border-ls-text-on-cream/15 bg-white/40 backdrop-blur-sm p-8 sm:p-10"
    >
      <p className="font-display text-6xl sm:text-7xl leading-none tracking-tight text-ls-text-on-cream">
        {t("value")}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ls-vermillion">
        {t("label")}
      </p>
      <p className="mt-5 text-base text-ls-text-on-cream leading-relaxed">
        {t("body")}
      </p>
    </motion.div>
  );
}

export default function LoopSociety() {
  const t = useTranslations("landing.loopSociety");

  return (
    <SectionContainer id="loop-society" surface="cream">
      <div className="max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-block text-xs font-medium uppercase tracking-[0.2em] text-ls-vermillion"
        >
          {t("eyebrow")}
        </motion.p>
        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight font-light text-ls-text-on-cream"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 font-display text-xl sm:text-2xl text-ls-text-on-cream leading-snug max-w-xl mx-auto"
        >
          {t("subheadline")}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-base text-ls-text-on-cream-muted leading-relaxed max-w-2xl mx-auto"
        >
          {t("body")}
        </motion.p>
      </div>

      <div className="mt-20 grid sm:grid-cols-2 gap-5">
        {STAT_KEYS.map((slug, i) => (
          <StatCard key={slug} slug={slug} index={i} />
        ))}
      </div>
    </SectionContainer>
  );
}
