"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";
import CTAButton from "./primitives/CTAButton";

const TOTAL_SPOTS = 50;

// Live signup count is wired up post-MVP; for now show a friendly placeholder
// so the section ships visually-complete. When the Supabase table lands we
// switch this to a server-side fetch + subscribe.
const PLACEHOLDER_TAKEN = 23;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BetaProgram() {
  const t = useTranslations("landing.beta");
  const perks = t.raw("perks") as string[];

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorKey, setErrorKey] = useState<"invalid" | "generic">("invalid");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setErrorKey("invalid");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      // TODO: wire to Supabase `beta_signups` table or external service.
      await new Promise((r) => setTimeout(r, 900));
      setStatus("success");
    } catch {
      setErrorKey("generic");
      setStatus("error");
    }
  };

  const percent = (PLACEHOLDER_TAKEN / TOTAL_SPOTS) * 100;

  return (
    <SectionContainer id="beta" surface="indigo">
      <div className="max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-ls-ochre/40 bg-ls-ochre/10 px-4 py-1.5 text-xs font-medium tracking-wide text-ls-ochre uppercase"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ls-ochre opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ls-ochre" />
          </span>
          {t("eyebrow")}
        </motion.p>

        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-lg text-ls-text-secondary leading-relaxed"
        >
          {t("body")}
        </motion.p>

        <motion.ul
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.3, staggerChildren: 0.06 }}
          className="mt-8 grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left"
        >
          {perks.map((p, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
              className="flex items-start gap-3 text-sm text-ls-text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="mt-0.5 h-4 w-4 text-ls-ochre shrink-0"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>{p}</span>
            </motion.li>
          ))}
        </motion.ul>

        <p className="mt-8 text-sm text-ls-text-secondary max-w-2xl mx-auto leading-relaxed">
          {t("footer")}
        </p>

        {/* Counter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 max-w-md mx-auto"
        >
          <div className="flex items-center justify-between text-xs text-ls-text-secondary mb-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ls-ochre animate-pulse" />
              {t("counter.live")}
            </span>
            <span className="font-mono">
              {t("counter.claimed", {
                taken: PLACEHOLDER_TAKEN,
                total: TOTAL_SPOTS,
              })}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${percent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
              className="h-full bg-gradient-to-r from-ls-ochre to-ls-vermillion"
            />
          </div>
        </motion.div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="mt-10 max-w-md mx-auto"
          aria-live="polite"
        >
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-ls-ochre/40 bg-ls-ochre/10 px-6 py-5 text-center"
            >
              <p className="text-ls-ochre font-medium">{t("form.success")}</p>
            </motion.div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1">
                <span className="sr-only">{t("form.emailLabel")}</span>
                <input
                  type="email"
                  required
                  placeholder={t("form.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 rounded-full border border-white/20 bg-white/5 px-5 text-base text-ls-text-primary placeholder:text-ls-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-ls-ochre focus:border-ls-ochre/60"
                />
              </label>
              <CTAButton
                type="submit"
                disabled={status === "submitting"}
                variant="primary"
                size="lg"
              >
                {status === "submitting" ? t("form.submitting") : t("form.submit")}
              </CTAButton>
            </div>
          )}
          {status === "error" ? (
            <p className="mt-3 text-sm text-red-300">
              {errorKey === "invalid" ? t("form.errorInvalid") : t("form.errorGeneric")}
            </p>
          ) : null}
        </form>
      </div>
    </SectionContainer>
  );
}
