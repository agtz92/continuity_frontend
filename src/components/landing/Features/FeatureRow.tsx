"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import AnimatedHeadline from "../primitives/AnimatedHeadline";

type Props = {
  label: string;
  headline: string;
  body: string;
  closing?: string;
  demo: ReactNode;
  reverse?: boolean;
  id?: string;
};

export default function FeatureRow({
  label,
  headline,
  body,
  closing,
  demo,
  reverse = false,
  id,
}: Props) {
  return (
    <article
      id={id}
      className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center"
    >
      <div className={`lg:col-span-5 ${reverse ? "lg:order-2" : ""}`}>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
          className="inline-block text-xs font-medium uppercase tracking-[0.2em] text-ls-ochre mb-5"
        >
          {label}
        </motion.span>
        <AnimatedHeadline
          text={headline}
          className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg text-ls-text-secondary leading-relaxed"
        >
          {body}
        </motion.p>
        {closing ? (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-base text-ls-ochre/90 font-medium italic"
          >
            {closing}
          </motion.p>
        ) : null}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={`lg:col-span-7 ${reverse ? "lg:order-1" : ""}`}
      >
        {demo}
      </motion.div>
    </article>
  );
}
