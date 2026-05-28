import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/siteUrl";

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
