"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import DeviceFrame from "../primitives/DeviceFrame";

export default function ResumeContextDemo() {
  const t = useTranslations("landing.features.resumeContext.demo");
  const blockers = t.raw("blockers") as string[];
  const decisions = t.raw("decisions") as string[];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref}>
      <DeviceFrame label="Resume context">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
          }}
          className="space-y-4"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            className="flex items-center gap-3"
          >
            <span className="text-2xl">👋</span>
            <h4 className="font-display text-xl text-ls-text-primary">
              {t("title")}
            </h4>
          </motion.div>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
            className="text-sm text-ls-text-secondary"
          >
            {t("lastWorked")}
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
            className="rounded-lg border border-ls-ochre/30 bg-ls-ochre/10 p-4"
          >
            <p className="text-xs uppercase tracking-wider text-ls-ochre mb-1">
              {t("nextActionLabel")}
            </p>
            <p className="text-sm text-ls-text-primary font-medium">
              → {t("nextAction")}
            </p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <p className="text-xs uppercase tracking-wider text-ls-text-secondary mb-2">
              {t("blockersLabel")}
            </p>
            <ul className="space-y-1.5">
              {blockers.map((b, i) => (
                <motion.li
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: -8 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  className="flex items-start gap-2 text-sm text-ls-text-secondary"
                >
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-ls-vermillion shrink-0" />
                  {b}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <p className="text-xs uppercase tracking-wider text-ls-text-secondary mb-2">
              {t("decisionsLabel")}
            </p>
            <ul className="space-y-1.5">
              {decisions.map((d, i) => (
                <motion.li
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: -8 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  className="flex items-start gap-2 text-sm text-ls-text-secondary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="mt-0.5 h-3.5 w-3.5 text-ls-ochre shrink-0"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {d}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </DeviceFrame>
    </div>
  );
}
