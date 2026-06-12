"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { marketingHref, switchLocalePath } from "@/i18n/marketingHref";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import CTAButton from "./primitives/CTAButton";

export default function MarketingNav() {
  const t = useTranslations("landing.nav");
  const tLang = useTranslations("landing.langSwitcher");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
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
    // Lazy-load supabase-js (~186 KB) so it stays out of the marketing pages'
    // initial bundle — the nav renders anonymous-first and upgrades once the
    // session resolves, so deferring the SDK doesn't change the UX.
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void import("@/lib/supabase").then(({ supabase }) => {
      if (!active) return;
      supabase.auth.getSession().then(({ data }) => {
        if (active) setAuthed(!!data.session);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
        setAuthed(!!s);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // Locale is now encoded in the URL (en at bare paths, es under /es), so
  // switching language navigates to the counterpart URL instead of setting a
  // cookie — this keeps the marketing pages statically cacheable.
  const handleLocaleChange = (next: Locale) => {
    if (next === locale) return;
    router.push(switchLocalePath(pathname, next));
  };

  // The resources hub is split into two monolingual route trees keyed by the
  // URL (see ResourcePages.tsx): Spanish lives at /recursos, every other
  // locale at /resources.
  const resourcesHref = locale === "es" ? "/recursos" : "/resources";
  const homeHref = marketingHref(locale, "/");

  return (
    // CSS entrance animation (`ls-nav-enter` in globals.css) instead of
    // framer-motion — keeps framer out of the marketing pages' bundle.
    <header
      className={`ls-nav-enter fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ls-navy/80 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <Link
          href={homeHref}
          className="font-display text-lg font-medium tracking-tight text-ls-text-primary"
        >
          continuu<span className="text-ls-ochre">.</span>it
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-ls-text-secondary">
          <Link href={marketingHref(locale, "/#features")} className="hover:text-ls-text-primary transition-colors">
            {t("features")}
          </Link>
          <Link href={marketingHref(locale, "/#pricing")} className="hover:text-ls-text-primary transition-colors">
            {t("pricing")}
          </Link>
          <Link href={marketingHref(locale, "/blog")} className="hover:text-ls-text-primary transition-colors">
            {t("blog")}
          </Link>
          <Link href={resourcesHref} className="hover:text-ls-text-primary transition-colors">
            {t("resources")}
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
                <CTAButton href={marketingHref(locale, "/#beta")} variant="primary" size="md">
                  {t("ctaShort")}
                </CTAButton>
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
