"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import DeviceFrame from "../primitives/DeviceFrame";

export default function ForcedClosureDemo() {
  const t = useTranslations("landing.features.forcedClosure.demo");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const id = setTimeout(() => setShowPrompt(true), 800);
    return () => clearTimeout(id);
  }, [inView]);

  return (
    <div ref={ref}>
      <DeviceFrame label="continuu.it">
        <div className="relative">
          {/* Project card — desaturates as days tick */}
          <motion.div
            animate={
              inView
                ? { filter: ["grayscale(0) opacity(1)", "grayscale(80%) opacity(0.6)"] }
                : undefined
            }
            transition={{ duration: 2, ease: "easeOut" }}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg text-ls-text-primary">
                {t("projectTitle")}
              </h4>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 text-yellow-400 px-2.5 py-1 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                Active
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-ls-text-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {t("daysSilent")}
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: "60%" }}
                  animate={inView ? { width: "60%" } : undefined}
                  className="h-full bg-ls-ochre"
                />
              </div>
            </div>
          </motion.div>

          {/* Forced closure modal */}
          <AnimatePresence>
            {showPrompt ? (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 rounded-xl border border-ls-ochre/40 bg-gradient-to-br from-ls-ochre/15 to-transparent p-5 backdrop-blur-sm"
              >
                <p className="text-sm text-ls-text-primary leading-relaxed">
                  {t("prompt")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-full bg-ls-ochre text-ls-navy px-4 py-2 text-xs font-medium"
                  >
                    {t("ship")}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-full border border-white/20 text-ls-text-primary px-4 py-2 text-xs"
                  >
                    {t("help")}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-full border border-white/10 text-ls-text-secondary px-4 py-2 text-xs hover:text-red-300 hover:border-red-400/40 transition-colors"
                  >
                    {t("kill")}
                  </motion.button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DeviceFrame>
    </div>
  );
}
