import type { MetadataRoute } from "next";
import {
  fetchBlogPosts,
  fetchHelpCategories,
  fetchHelpResources,
  fetchNavPages,
  type PublicBlogPost,
  type PublicHelpResource,
} from "@/lib/publicGraphql";
import { resolveSiteUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

// Resources hub is split by locale: English lives at /resources, Spanish at
// /recursos. Each row carries its own locale.
function resourceBase(locale: string): string {
  return locale === "es" ? "/recursos" : "/resources";
}

async function fetchAllBlogPosts(): Promise<PublicBlogPost[]> {
  const perPage = 100;
  const all: PublicBlogPost[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const result = await fetchBlogPosts({ page, perPage });
    if (!result) break;
    all.push(...result.posts);
    if (!result.hasNext) break;
  }
  return all;
}

async function fetchAllHelpResources(): Promise<PublicHelpResource[]> {
  const perPage = 100;
  const all: PublicHelpResource[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const result = await fetchHelpResources({ page, perPage });
    if (!result) break;
    all.push(...result.resources);
    if (!result.hasNext) break;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    // English (canonical) marketing
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/welcome`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    // Spanish marketing (/es prefix; resources keep /recursos)
    { url: `${base}/es`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/es/blog`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/recursos`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/es/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/es/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/es/welcome`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    // Auth (shared, English-only)
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/reset-password`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [navPages, blogPosts, helpCategories, helpResources] = await Promise.all([
    fetchNavPages().catch(() => []),
    fetchAllBlogPosts().catch(() => []),
    fetchHelpCategories().catch(() => []),
    fetchAllHelpResources().catch(() => []),
  ]);

  const pageEntries: MetadataRoute.Sitemap = navPages.map((page) => ({
    url: `${base}${page.path.startsWith("/") ? page.path : `/${page.path}`}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // A post lives in exactly one locale (slugs are globally unique); Spanish
  // posts are served under /es/blog, English at /blog.
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${base}${post.locale === "es" ? "/es/blog" : "/blog"}/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const helpCategoryEntries: MetadataRoute.Sitemap = helpCategories.map(
    (category) => ({
      url: `${base}${resourceBase(category.locale)}/${category.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    })
  );

  const helpResourceEntries: MetadataRoute.Sitemap = helpResources.map(
    (resource) => ({
      url: `${base}${resourceBase(resource.locale)}/${resource.categorySlug}/${resource.slug}`,
      lastModified: resource.publishedAt ? new Date(resource.publishedAt) : now,
      changeFrequency: "monthly",
      priority: 0.5,
    })
  );

  return [
    ...staticEntries,
    ...pageEntries,
    ...blogEntries,
    ...helpCategoryEntries,
    ...helpResourceEntries,
  ];
}
