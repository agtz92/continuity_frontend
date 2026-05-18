"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

export default function Promise() {
  const t = useTranslations("landing.promise");

  return (
    <SectionContainer id="promise" surface="indigo">
      <div className="max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-block rounded-full border border-ls-ochre/30 bg-ls-ochre/10 px-4 py-1.5 text-xs font-medium tracking-wide text-ls-ochre uppercase"
        >
          {t("eyebrow")}
        </motion.p>

        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-4xl sm:text-5xl lg:text-7xl leading-[1.02] tracking-tight font-light text-ls-text-primary"
        />

        <div className="mt-10 space-y-5 text-lg text-ls-text-secondary leading-relaxed">
          {(["p1", "p2", "p3", "p4", "p5"] as const).map((key, i) => (
            <motion.p
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className={
                key === "p2"
                  ? "font-display text-2xl sm:text-3xl text-ls-text-primary"
                  : key === "p5"
                    ? "text-ls-text-primary font-medium"
                    : ""
              }
            >
              {t(key)}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <CTAButton href="#beta" variant="primary" size="lg">
            {t("cta")}
          </CTAButton>
        </motion.div>
      </div>
    </SectionContainer>
  );
}
