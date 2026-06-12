import type { Metadata } from "next";
import { getStaticTranslator } from "@/i18n/static";
import { marketingHref } from "@/i18n/marketingHref";
import type { Locale } from "@/i18n/config";
import MarketingNav from "@/components/landing/MarketingNav";
import MarketingFooter from "@/components/landing/MarketingFooter";

/**
 * Shared legal page (privacy + terms), static per locale.
 *   en: /privacy, /terms   ·   es: /es/privacy, /es/terms
 */

export type LegalKind = "privacy" | "terms";

type LegalSection = { heading: string; body: string[] };

export function legalMetadata(locale: Locale, kind: LegalKind): Metadata {
  const t = getStaticTranslator(locale, `landing.${kind}`);
  const path = `/${kind}`;
  return {
    title: t("title"),
    description: t("intro"),
    alternates: {
      canonical: marketingHref(locale, path),
      languages: { en: path, es: `/es${path}`, "x-default": path },
    },
  };
}

export default function LegalPage({
  locale,
  kind,
}: {
  locale: Locale;
  kind: LegalKind;
}) {
  const t = getStaticTranslator(locale, `landing.${kind}`);
  const sections = t.raw("sections") as LegalSection[];

  return (
    <div
      data-surface="marketing"
      className="min-h-screen bg-ls-navy text-ls-text-primary font-sans antialiased selection:bg-ls-ochre/30 selection:text-ls-text-primary"
    >
      <MarketingNav />

      <main className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-ls-ochre/10 blur-[140px]" />
        </div>

        <div className="mx-auto w-full max-w-3xl px-6 sm:px-8 lg:px-12">
          <header className="mb-12">
            <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.95] tracking-tight font-light text-ls-text-primary">
              {t("title")}
              <span className="text-ls-ochre">.</span>
            </h1>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ls-text-secondary">
              {t("lastUpdated")}
            </p>
            <p className="mt-6 text-base sm:text-lg text-ls-text-secondary leading-relaxed">
              {t("intro")}
            </p>
          </header>

          <div className="space-y-12">
            {sections.map((section, i) => (
              <section key={i}>
                <h2 className="font-display text-2xl sm:text-3xl font-light text-ls-text-primary">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph, j) => (
                    <p key={j} className="text-ls-text-secondary leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
