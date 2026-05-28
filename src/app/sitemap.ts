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
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/ayuda`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/reset-password`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/welcome`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
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

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const helpCategoryEntries: MetadataRoute.Sitemap = helpCategories.map(
    (category) => ({
      url: `${base}/ayuda/${category.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    })
  );

  const helpResourceEntries: MetadataRoute.Sitemap = helpResources.map(
    (resource) => ({
      url: `${base}/ayuda/${resource.categorySlug}/${resource.slug}`,
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
