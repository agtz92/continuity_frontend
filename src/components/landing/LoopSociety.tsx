"use client";

import { useTranslations } from "next-intl";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import type { MouseEvent } from "react";
import { getAvatarUrl } from "@/lib/avatars";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";

const ARCHETYPES = [
  "momo",
  "yuki",
  "tako",
  "kuma",
  "hoshi",
  "pip",
  "tetsu",
] as const;

const PREMIUM = new Set<string>(["tetsu"]);

function ArchetypeCard({ slug }: { slug: (typeof ARCHETYPES)[number] }) {
  const t = useTranslations(`landing.loopSociety.archetypes.${slug}`);
  const tCommon = useTranslations("landing.loopSociety");
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [10, -10]);
  const rotateY = useTransform(x, [-50, 50], [-10, 10]);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    x.set(dx);
    y.set(dy);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ rotateX: reduce ? 0 : springX, rotateY: reduce ? 0 : springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl border border-ls-text-on-cream/15 bg-white/40 backdrop-blur-sm p-6 cursor-default"
    >
      {PREMIUM.has(slug) ? (
        <span className="absolute top-4 right-4 rounded-full bg-ls-vermillion text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
          {tCommon("premium")}
        </span>
      ) : null}

      <div className="relative h-32 w-32 mx-auto rounded-full overflow-hidden ring-2 ring-white/40 shadow-[0_15px_35px_rgba(26,31,77,0.25)]">
        <Image
          src={getAvatarUrl(`3d/${slug}`)}
          alt={t("name")}
          fill
          sizes="8rem"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
      </div>

      <div className="mt-5 text-center">
        <h3 className="font-display text-2xl text-ls-text-on-cream">
          {t("name")}
        </h3>
        <p className="text-xs uppercase tracking-wider text-ls-text-on-cream-muted mt-1">
          {t("species")}
        </p>
        <p className="mt-3 text-sm font-medium text-ls-text-on-cream">
          {t("tagline")}
        </p>
        <p className="mt-2 text-xs text-ls-text-on-cream-muted leading-relaxed min-h-[3rem]">
          {t("story")}
        </p>
      </div>
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

      <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 [perspective:1200px]">
        {ARCHETYPES.map((slug) => (
          <ArchetypeCard key={slug} slug={slug} />
        ))}
      </div>
    </SectionContainer>
  );
}
