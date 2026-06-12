import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPage } from "@/lib/publicGraphql";
import { lazyLoadContentImages } from "@/lib/contentHtml";
import { marketingHref } from "@/i18n/marketingHref";
import type { Locale } from "@/i18n/config";

/** Shared CMS page (catch-all /[slug] and /es/[slug]), static per locale. */

// Slugs reserved by app/ folders — Next routes static segments before dynamic
// ones, but we also guard here to be defensive.
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "blog",
  "es",
  "login",
  "recursos",
  "reset-password",
  "resources",
  "settings",
  "welcome",
  "_next",
]);

export async function cmsPageMetadata(
  locale: Locale,
  slug: string
): Promise<Metadata> {
  if (RESERVED_SLUGS.has(slug)) return { title: "Not found" };
  const page = await fetchPage(slug, locale);
  if (!page) return { title: "Not found" };
  return {
    title: page.seoTitle || `${page.title} — Continuity`,
    description: page.seoDescription || page.excerpt || undefined,
    alternates: {
      canonical: marketingHref(locale, `/${slug}`),
      languages: {
        en: `/${slug}`,
        es: `/es/${slug}`,
        "x-default": `/${slug}`,
      },
    },
  };
}

export default async function CmsPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  if (RESERVED_SLUGS.has(slug)) notFound();
  const page = await fetchPage(slug, locale);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href={marketingHref(locale, "/")}
        className="text-sm text-accent hover:underline"
      >
        ← Continuity
      </Link>
      <article className="mt-6">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-text">{page.title}</h1>
          {page.excerpt && <p className="mt-2 text-text-muted">{page.excerpt}</p>}
        </header>
        {page.coverImageUrl && (
          <div className="relative mb-8 aspect-[16/9] max-h-96 w-full overflow-hidden rounded-lg">
            <Image
              src={page.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: lazyLoadContentImages(page.contentHtml) }}
        />
      </article>
    </main>
  );
}
