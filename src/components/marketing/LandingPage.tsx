import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import RedirectIfAuthed from "@/components/landing/RedirectIfAuthed";
import { getStaticTranslator } from "@/i18n/static";
import { marketingHref } from "@/i18n/marketingHref";
import { resolveSiteUrl } from "@/lib/siteUrl";
import type { Locale } from "@/i18n/config";

/**
 * Shared landing surface, static per locale.
 *   en: /  and /welcome    ·    es: /es  and /es/welcome
 *
 * `redirectIfAuthed` reproduces the old server `/` behavior (signed-in users go
 * to /dashboard) on the client, so the page stays static. `/welcome` passes
 * false — it's intentionally a public landing even for signed-in users.
 */

export function landingMetadata(locale: Locale): Metadata {
  const t = getStaticTranslator(locale, "landing.meta");
  const site = resolveSiteUrl();
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    alternates: {
      canonical: marketingHref(locale, "/"),
      languages: { en: "/", es: "/es", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      siteName: "continuu.it",
      url: site,
      locale,
      title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default function LandingPage({
  locale,
  redirectIfAuthed = false,
}: {
  locale: Locale;
  redirectIfAuthed?: boolean;
}) {
  const t = getStaticTranslator(locale, "landing.meta");
  const site = resolveSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "continuu.it",
      url: site,
      logo: `${site}/icon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "continuu.it",
      url: site,
      description: t("description"),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "continuu.it",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: site,
      description: t("description"),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {redirectIfAuthed && <RedirectIfAuthed />}
      <Landing />
    </>
  );
}
