"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/avatars";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";

const STACKED_AVATARS = [
  { slug: "pip", rotate: -8, top: 0, left: 0 },
  { slug: "tako", rotate: 6, top: 40, left: 100 },
  { slug: "kuma", rotate: -3, top: 110, left: 30 },
  { slug: "yuki", rotate: 10, top: 150, left: 150 },
] as const;

export default function Recognition() {
  const t = useTranslations("landing.recognition");

  return (
    <SectionContainer id="recognition" surface="navy">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        {/* Left: copy */}
        <div className="lg:col-span-7">
          <AnimatedHeadline
            text={t("headline")}
            className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
          />

          <div className="mt-10 space-y-5 text-lg text-ls-text-secondary leading-relaxed max-w-xl">
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
            className="mt-12 border-l-2 border-ls-ochre/60 pl-6 max-w-xl"
          >
            <blockquote className="font-display text-xl sm:text-2xl text-ls-text-primary italic leading-snug">
              &ldquo;{t("callout")}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-sm text-ls-text-secondary">
              — {t("calloutAuthor")}
            </figcaption>
          </motion.figure>
        </div>

        {/* Right: graveyard visual */}
        <div className="lg:col-span-5">
          <div className="relative h-[420px] mx-auto max-w-sm">
            {STACKED_AVATARS.map((a, i) => (
              <motion.div
                key={a.slug}
                initial={{ opacity: 0, y: 40, rotate: 0 }}
                whileInView={{ opacity: 0.5, y: 0, rotate: a.rotate }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
                style={{ top: a.top, left: a.left }}
              >
                <div className="relative h-32 w-32 rounded-full overflow-hidden grayscale-[60%] sepia-[15%] ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                  <Image
                    src={getAvatarUrl(`3d/${a.slug}`)}
                    alt=""
                    fill
                    sizes="8rem"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </motion.div>
            ))}
            {/* Cracked ground hint */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-ls-ochre/40 to-transparent origin-center"
            />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
