"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import DeviceFrame from "../primitives/DeviceFrame";

export default function NotificationsDemo() {
  const t = useTranslations("landing.features.notifications.demo");
  const secondary = t.raw("secondary") as string[];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref}>
      <DeviceFrame variant="phone" label="Telegram">
        <div className="space-y-3 min-h-[420px]">
          {/* Time stamp */}
          <p className="text-center text-[10px] text-ls-text-secondary uppercase tracking-wider">
            7:30 AM
          </p>

          {/* Bot message */}
          {step >= 1 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-start"
            >
              <p className="text-[11px] text-ls-text-secondary mb-1 ml-3">
                {t("botName")}
              </p>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 px-4 py-3 text-sm">
                <p className="text-ls-text-primary flex items-center gap-1.5">
                  <span>☀️</span> {t("greeting")}
                </p>
                {step >= 2 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mt-3 space-y-2.5"
                  >
                    <p className="text-xs text-ls-text-secondary">
                      {t("todayLabel")}
                    </p>
                    <div className="rounded-lg border border-ls-ochre/30 bg-ls-ochre/10 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-ls-ochre mb-1">
                        📌 {t("topPriorityLabel")}
                      </p>
                      <p className="text-sm text-ls-text-primary font-medium">
                        {t("topPriority")}
                      </p>
                      <p className="mt-1 text-[11px] text-ls-text-secondary italic">
                        {t("topPriorityNote")}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {secondary.map((s, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.2 + i * 0.1 }}
                          className="flex items-start gap-2 text-xs text-ls-text-secondary"
                        >
                          <span className="mt-0.5">🔸</span>
                          <span>{s}</span>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-[11px] text-ls-text-secondary/80 mt-2 pt-2 border-t border-white/5">
                      {t("footer")}
                    </p>
                  </motion.div>
                ) : (
                  <span className="inline-flex gap-1 mt-2">
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
                )}
              </div>
            </motion.div>
          ) : null}

          {/* User reply */}
          {step >= 3 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-end"
            >
              <div className="rounded-2xl rounded-tr-sm bg-ls-ochre/90 text-ls-navy px-3.5 py-2 text-sm font-mono">
                {t("userReply")}
              </div>
            </motion.div>
          ) : null}
        </div>
      </DeviceFrame>
    </div>
  );
}
