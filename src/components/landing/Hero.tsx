"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { getAvatarUrl } from "@/lib/avatars";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

const HERO_AVATARS = [
  { slug: "momo", x: -180, y: 10, delay: 0 },
  { slug: "pip", x: -60, y: -30, delay: 0.4 },
  { slug: "hoshi", x: 60, y: -30, delay: 0.8 },
  { slug: "tetsu", x: 180, y: 10, delay: 1.2 },
] as const;

export default function Hero() {
  const t = useTranslations("landing.hero");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const avatarsY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80]);
  const avatarsOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);

  return (
    <SectionContainer surface="navy" className="min-h-[100svh] flex items-center">
      <div
        ref={ref}
        className="relative flex flex-col items-center text-center pt-24 sm:pt-32"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-ls-ochre/10 blur-[120px]" />
          <div className="absolute top-2/3 left-1/3 h-[400px] w-[600px] rounded-full bg-ls-vermillion/10 blur-[100px]" />
        </div>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-ls-text-secondary backdrop-blur-md"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ls-ochre opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ls-ochre" />
          </span>
          {t("eyebrow")}
        </motion.p>

        <AnimatedHeadline
          as="h1"
          text={t("headline")}
          className="font-display text-[clamp(3rem,9vw,7rem)] leading-[0.95] tracking-tight font-light text-ls-text-primary max-w-[18ch]"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 max-w-2xl text-base sm:text-lg text-ls-text-secondary leading-relaxed"
        >
          {t("subheadline")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <CTAButton href="#beta" variant="primary" size="lg">
            {t("ctaPrimary")}
          </CTAButton>
          <p className="text-xs text-ls-text-secondary/80">{t("ctaSecondary")}</p>
        </motion.div>

        {/* Floating yokai */}
        <motion.div
          style={{ y: avatarsY, opacity: avatarsOpacity }}
          className="mt-20 relative h-44 sm:h-56 w-full max-w-3xl"
          aria-hidden="true"
        >
          {HERO_AVATARS.map((a) => (
            <motion.div
              key={a.slug}
              initial={{ opacity: 0, scale: 0.6, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: a.y }}
              transition={{
                duration: 1.2,
                delay: 0.9 + a.delay * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute top-1/2 left-1/2"
              style={{ x: a.x, translateY: a.y }}
            >
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : { y: [0, -10, 0] }
                }
                transition={{
                  duration: 4 + a.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: a.delay,
                }}
                className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full overflow-hidden ring-1 ring-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]"
              >
                <Image
                  src={getAvatarUrl(`3d/${a.slug}`)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 7rem, 9rem"
                  className="object-cover"
                  priority
                  unoptimized
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="mt-12 flex flex-col items-center gap-3 text-xs uppercase tracking-[0.2em] text-ls-text-secondary/70"
        >
          {t("scrollHint")}
          <motion.span
            aria-hidden="true"
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="block h-8 w-px bg-gradient-to-b from-ls-text-secondary/70 to-transparent"
          />
        </motion.div>
      </div>
    </SectionContainer>
  );
}
