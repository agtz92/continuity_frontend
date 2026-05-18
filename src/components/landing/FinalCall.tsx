"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

export default function FinalCall() {
  const t = useTranslations("landing.finalCall");

  return (
    <SectionContainer id="final-call" surface="navy">
      <div className="max-w-4xl mx-auto text-center relative">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-ls-ochre/10 blur-[120px]" />
        </div>

        <AnimatedHeadline
          text={t("headlineLine1")}
          className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />
        <div className="h-4" />
        <AnimatedHeadline
          text={t("headlineLine2")}
          delay={0.4}
          className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-ochre"
        />

        <div className="mt-12 space-y-5 text-lg text-ls-text-secondary leading-relaxed max-w-2xl mx-auto">
          {(["p1", "p2", "p3", "p4", "p5", "p6"] as const).map((key, i) => (
            <motion.p
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={
                key === "p3" || key === "p4"
                  ? "font-display text-2xl sm:text-3xl text-ls-text-primary"
                  : key === "p6"
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
          className="mt-16 flex flex-col items-center gap-3"
        >
          <CTAButton href="#beta" variant="primary" size="lg">
            {t("cta")}
          </CTAButton>
          <p className="text-sm text-ls-text-secondary">{t("subCta")}</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-24 font-display text-3xl sm:text-4xl text-ls-ochre italic"
        >
          {t("tagline")}
        </motion.p>
      </div>
    </SectionContainer>
  );
}
