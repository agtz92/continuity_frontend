"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import DeviceFrame from "../primitives/DeviceFrame";

export default function SundayReviewDemo() {
  const t = useTranslations("landing.features.sundayReview.demo");
  const questions = t.raw("questions") as string[];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % questions.length);
    }, 3000);
    return () => clearInterval(id);
  }, [inView, questions.length]);

  return (
    <div ref={ref}>
      <DeviceFrame label={t("title")}>
        <div className="space-y-5 min-h-[280px]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-display text-lg text-ls-text-primary">
                {t("title")}
              </p>
              <p className="text-xs text-ls-text-secondary">{t("subtitle")}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= index ? "bg-ls-ochre" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-5 min-h-[180px] flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-ls-text-secondary mb-2">
                {index + 1} / {questions.length}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="font-display text-xl sm:text-2xl text-ls-text-primary leading-snug"
                >
                  {questions[index]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-6">
              <div className="rounded-md bg-ls-navy/60 border border-white/10 px-3 py-2.5 text-sm text-ls-text-secondary">
                {t("placeholder")}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-full bg-ls-ochre text-ls-navy px-4 py-1.5 text-xs font-medium"
                >
                  {t("cta")} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </DeviceFrame>
    </div>
  );
}
