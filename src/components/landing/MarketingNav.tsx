"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { setLocale } from "@/i18n/actions";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import CTAButton from "./primitives/CTAButton";

export default function MarketingNav() {
  const t = useTranslations("landing.nav");
  const tLang = useTranslations("landing.langSwitcher");
  const locale = useLocale() as Locale;
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  // null = unknown (still checking), false = anon, true = signed in.
  // We render anonymous-state UI by default so SSR markup matches the most
  // common case (visitors hitting the public landing); the client upgrades to
  // signed-in UI as soon as Supabase resolves the session from localStorage.
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setAuthed(!!s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLocaleChange = (next: Locale) => {
    if (next === locale) return;
    void setLocale(next);
  };

  return (
    <motion.header
      initial={reduce ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ls-navy/80 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <Link
          href="#top"
          className="font-display text-lg font-medium tracking-tight text-ls-text-primary"
        >
          continuu<span className="text-ls-ochre">.</span>it
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-ls-text-secondary">
          <a href="#features" className="hover:text-ls-text-primary transition-colors">
            {t("features")}
          </a>
          <a href="#loop-society" className="hover:text-ls-text-primary transition-colors">
            {t("loopSociety")}
          </a>
          <a href="#pricing" className="hover:text-ls-text-primary transition-colors">
            {t("pricing")}
          </a>
          <Link href="/blog" className="hover:text-ls-text-primary transition-colors">
            {t("blog")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label={tLang("ariaLabel")}
            className="hidden sm:flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-xs"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLocaleChange(l)}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  l === locale
                    ? "bg-white/10 text-ls-text-primary"
                    : "text-ls-text-secondary hover:text-ls-text-primary"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {authed ? (
            <CTAButton href="/dashboard" variant="primary" size="md">
              {t("dashboard")}
            </CTAButton>
          ) : (
            <>
              <CTAButton href="/login" variant="ghost" size="md">
                {t("signIn")}
              </CTAButton>
              <span className="hidden sm:inline-block">
                <CTAButton href="#beta" variant="primary" size="md">
                  {t("ctaShort")}
                </CTAButton>
              </span>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
