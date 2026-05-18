"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import DeviceFrame from "../primitives/DeviceFrame";

export default function AIChatDemo() {
  const t = useTranslations("landing.features.aiChat.demo");
  const questions = t.raw("questions") as string[];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref}>
      <DeviceFrame label={t("projectTitle")}>
        <div className="space-y-3">
          {/* User message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={step >= 1 ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.4 }}
            className="flex justify-end"
          >
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ls-ochre text-ls-navy px-4 py-3 text-sm">
              {t("userMessage")}
            </div>
          </motion.div>

          {/* AI typing then response */}
          {step >= 2 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-start gap-2"
            >
              <div className="mt-1 h-7 w-7 shrink-0 rounded-full bg-ls-vermillion/20 border border-ls-vermillion/30 flex items-center justify-center">
                <span className="text-xs text-ls-vermillion font-medium">AI</span>
              </div>
              <div className="max-w-[85%] space-y-3">
                <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3 text-sm text-ls-text-primary">
                  {step === 2 ? (
                    <span className="inline-flex gap-1">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="h-1.5 w-1.5 rounded-full bg-ls-text-secondary"
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                        className="h-1.5 w-1.5 rounded-full bg-ls-text-secondary"
                      />
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                        className="h-1.5 w-1.5 rounded-full bg-ls-text-secondary"
                      />
                    </span>
                  ) : (
                    <>
                      <p>{t("aiResponse")}</p>
                      <ol className="mt-3 space-y-2 list-decimal list-inside marker:text-ls-ochre text-ls-text-secondary">
                        {questions.map((q, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
                          >
                            {q}
                          </motion.li>
                        ))}
                      </ol>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 + questions.length * 0.15 }}
                        className="mt-3 text-ls-text-secondary text-xs"
                      >
                        {t("footer")}
                      </motion.p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </DeviceFrame>
    </div>
  );
}
