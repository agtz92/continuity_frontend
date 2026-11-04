import type { Metadata } from "next";
import { getStaticTranslator } from "@/i18n/static";
import { marketingHref } from "@/i18n/marketingHref";
import { resolveSiteUrl } from "@/lib/siteUrl";
import { fetchBetaProgram } from "@/lib/publicGraphql";
import type { Locale } from "@/i18n/config";
import MarketingNav from "@/components/landing/MarketingNav";
import MarketingFooter from "@/components/landing/MarketingFooter";
import Pricing from "@/components/landing/Pricing";
import CTAButton from "@/components/landing/primitives/CTAButton";

/**
 * Dedicated pricing page, static per locale.
 *   en: /pricing   ·   es: /es/pricing
 *
 * Reuses the landing's <Pricing/> cards and adds a full comparison table and
 * an FAQ. Every number here has a source of truth in the backend:
 *   - prices → `PRICE_*_AMOUNT_CENTS` in backend/continuity/settings.py
 *   - limits → `ENTITY_QUOTAS` in backend/core/quotas.py
 *   - Loop   → `assistant_mode` in backend/core/assistant/tiers.py
 * Change them there first, then here (`landing.pricingPage.*`).
 */

type CompareRow = { feature: string; free: string; pro: string; studio: string };
type CompareGroup = { title: string; rows: CompareRow[] };
type Faq = { q: string; a: string };

export function pricingMetadata(locale: Locale): Metadata {
  const t = getStaticTranslator(locale, "landing.pricingPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: marketingHref(locale, "/pricing"),
      languages: { en: "/pricing", es: "/es/pricing", "x-default": "/pricing" },
    },
  };
}

/** "✓" / "—" render as icons; anything else is shown as text. */
function Cell({ value, highlight }: { value: string; highlight?: boolean }) {
  if (value === "✓") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="mx-auto h-4 w-4 text-ls-ochre"
        aria-label="✓"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (value === "—") {
    return <span className="text-ls-text-secondary/60" aria-label="—">—</span>;
  }
  return (
    <span className={highlight ? "text-ls-text-primary" : "text-ls-text-secondary"}>
      {value}
    </span>
  );
}

export default async function PricingPage({ locale }: { locale: Locale }) {
  const t = getStaticTranslator(locale, "landing.pricingPage");
  const tTiers = getStaticTranslator(locale, "landing.pricing.tiers");
  const groups = t.raw("compare.groups") as CompareGroup[];
  const faqs = t.raw("faq.items") as Faq[];
  const beta = await fetchBetaProgram();
  const site = resolveSiteUrl();

  const tiers = ["free", "pro", "studio"] as const;

  // Product + offers, so search results can show the real USD prices.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "continuu.it",
      url: `${site}${marketingHref(locale, "/pricing")}`,
      description: t("metaDescription"),
      offers: [
        { name: "Free", price: "0", period: null },
        { name: "Pro", price: "8.99", period: "P1M" },
        { name: "Pro", price: "89.99", period: "P1Y" },
        { name: "Studio", price: "14.99", period: "P1M" },
        { name: "Studio", price: "149.99", period: "P1Y" },
      ].map((o) => ({
        "@type": "Offer",
        name: o.name,
        price: o.price,
        priceCurrency: "USD",
        ...(o.period
          ? {
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: o.price,
                priceCurrency: "USD",
                billingDuration: o.period,
              },
            }
          : {}),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div
      id="top"
      data-surface="marketing"
      className="min-h-screen bg-ls-navy text-ls-text-primary font-sans antialiased selection:bg-ls-ochre/30 selection:text-ls-text-primary"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav beta={beta} />

      <main className="pt-16">
        <Pricing beta={beta} standalone />

        {/* Full comparison */}
        <section className="bg-ls-navy pb-24 sm:pb-32 scroll-mt-20" id="compare">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 lg:px-12">
            <h2 className="font-display text-3xl sm:text-4xl font-light tracking-tight text-center text-ls-text-primary">
              {t("compare.title")}
            </h2>
            <p className="mt-4 text-center text-ls-text-secondary">
              {t("compare.subtitle")}
            </p>

            <div className="mt-12 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-5 text-left font-normal text-ls-text-secondary">
                      <span className="sr-only">{t("compare.featureColumn")}</span>
                    </th>
                    {tiers.map((tier) => (
                      <th
                        key={tier}
                        scope="col"
                        className={`p-5 text-center align-bottom ${
                          tier === "pro" ? "bg-ls-ochre/[0.06]" : ""
                        }`}
                      >
                        <div className="font-display text-xl font-normal text-ls-text-primary">
                          {tTiers(`${tier}.name`)}
                        </div>
                        <div className="mt-1 text-xs font-normal text-ls-text-secondary">
                          {t(`compare.priceLine.${tier}`)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                {groups.map((group) => (
                  <tbody key={group.title}>
                    <tr>
                      <th
                        colSpan={4}
                        scope="colgroup"
                        className="px-5 pt-8 pb-3 text-left text-xs font-medium uppercase tracking-[0.18em] text-ls-ochre"
                      >
                        {group.title}
                      </th>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.feature} className="border-t border-white/5">
                        <th
                          scope="row"
                          className="px-5 py-3.5 text-left font-normal text-ls-text-primary"
                        >
                          {row.feature}
                        </th>
                        <td className="px-5 py-3.5 text-center">
                          <Cell value={row.free} />
                        </td>
                        <td className="px-5 py-3.5 text-center bg-ls-ochre/[0.06]">
                          <Cell value={row.pro} highlight />
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Cell value={row.studio} highlight />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-ls-navy pb-24 sm:pb-32" id="faq">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-8">
            <h2 className="font-display text-3xl sm:text-4xl font-light tracking-tight text-center text-ls-text-primary">
              {t("faq.title")}
            </h2>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base text-ls-text-primary [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="text-ls-ochre transition-transform duration-200 group-open:rotate-45 text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-ls-text-secondary leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="font-display text-2xl text-ls-text-primary">
                {t("closing.title")}
              </p>
              <p className="mt-3 text-ls-text-secondary">{t("closing.body")}</p>
              <div className="mt-6">
                <CTAButton href="/login" variant="primary" size="md">
                  {t("closing.cta")}
                </CTAButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
