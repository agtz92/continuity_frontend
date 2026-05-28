import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getServerSession } from "@/lib/supabase-server";
import { resolveSiteUrl } from "@/lib/siteUrl";
import Landing from "@/components/landing/Landing";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("landing.meta"),
    getLocale(),
  ]);
  const site = resolveSiteUrl();
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        es: "/",
        "x-default": "/",
      },
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

export default async function Home() {
  const session = await getServerSession();
  if (session) redirect("/dashboard");
  const site = resolveSiteUrl();
  const t = await getTranslations("landing.meta");
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
      <Landing />
    </>
  );
}
