"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
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
          {(["p1", "p2", "p3"] as const).map((key, i) => (
            <motion.p
              key={key}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            >
              {t(key)}
            </motion.p>
          ))}
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-ls-text-primary"
          >
            {t("p4")}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="font-medium text-ls-ochre"
          >
            {t("p5")}
          </motion.p>
        </div>

        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 border-l-2 border-ls-ochre/60 pl-6"
        >
          <blockquote className="font-display text-xl sm:text-2xl text-ls-text-primary italic leading-snug">
            &ldquo;{t("callout")}&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-sm text-ls-text-secondary">
            — {t("calloutAuthor")}
          </figcaption>
        </motion.figure>
      </div>
    </SectionContainer>
  );
}
