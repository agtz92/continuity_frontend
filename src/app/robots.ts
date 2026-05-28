import type { MetadataRoute } from "next";

const FALLBACK_SITE_URL = "https://continuu.it";

function resolveSiteUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? null;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");
  return FALLBACK_SITE_URL;
}

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/dashboard",
          "/settings",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
