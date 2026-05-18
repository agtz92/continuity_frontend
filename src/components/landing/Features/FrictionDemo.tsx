"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import DeviceFrame from "../primitives/DeviceFrame";

type ActiveProject = { name: string; status: string };

export default function FrictionDemo() {
  const t = useTranslations("landing.features.friction.demo");
  const projects = t.raw("activeProjects") as ActiveProject[];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [typed, setTyped] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const target = t("newProjectPlaceholder");
    let i = 0;
    const typeTimer = setInterval(() => {
      i++;
      setTyped(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(typeTimer);
        setTimeout(() => setShowModal(true), 600);
      }
    }, 40);
    return () => clearInterval(typeTimer);
  }, [inView, t]);

  return (
    <div ref={ref}>
      <DeviceFrame label="continuu.it">
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <label className="block text-xs uppercase tracking-wider text-ls-text-secondary mb-2">
              {t("newProjectLabel")}
            </label>
            <div className="rounded-md bg-ls-navy/60 border border-white/10 px-3 py-2.5 text-sm text-ls-text-primary min-h-[2.5rem] flex items-center">
              {typed}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="ml-0.5 inline-block h-4 w-px bg-ls-ochre"
              />
            </div>
          </div>

          <AnimatePresence>
            {showModal ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 -m-3 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-ls-navy/80 backdrop-blur-sm rounded-2xl" />
                <div className="relative w-full max-w-md rounded-2xl border border-ls-ochre/40 bg-ls-indigo p-5 shadow-2xl">
                  <h5 className="font-display text-lg text-ls-text-primary">
                    {t("modalTitle")}
                  </h5>
                  <p className="mt-2 text-sm text-ls-text-secondary">
                    {t("modalBody")}
                  </p>
                  <ul className="mt-4 space-y-1.5 max-h-44 overflow-hidden">
                    {projects.map((p, i) => (
                      <motion.li
                        key={p.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                        className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-xs"
                      >
                        <span className="text-ls-text-primary font-medium">
                          {p.name}
                        </span>
                        <span className="text-ls-text-secondary">{p.status}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-ls-ochre text-ls-navy px-3.5 py-1.5 text-xs font-medium"
                    >
                      {t("pauseExisting")}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/20 text-ls-text-primary px-3.5 py-1.5 text-xs"
                    >
                      {t("reconsider")}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 text-ls-text-secondary px-3.5 py-1.5 text-xs"
                    >
                      {t("continueNew")}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DeviceFrame>
    </div>
  );
}
