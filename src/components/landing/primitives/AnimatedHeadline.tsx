"use client";

import { motion, useReducedMotion } from "framer-motion";
import { createElement } from "react";
import type { ElementType } from "react";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
};

/**
 * Word-by-word reveal headline. Splits on whitespace, animates each word with
 * a small stagger. Respects `prefers-reduced-motion` — we just fade the whole
 * line instead of moving anything.
 */
export default function AnimatedHeadline({
  text,
  as = "h2",
  className = "",
  delay = 0,
}: Props) {
  const reduce = useReducedMotion();

  if (reduce) {
    return createElement(
      as,
      { className },
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4, delay }}
      >
        {text}
      </motion.span>,
    );
  }

  const words = text.split(/\s+/);

  return createElement(
    as,
    { className },
    <>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        transition={{ staggerChildren: 0.06, delayChildren: delay }}
        className="inline"
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            variants={{
              hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block mr-[0.25em] last:mr-0"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </>,
  );
}
