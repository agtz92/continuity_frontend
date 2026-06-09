import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchHelpCategories,
  fetchHelpResource,
  fetchHelpResources,
} from "@/lib/publicGraphql";
import type { Locale } from "@/i18n/config";

/**
 * Shared implementation for the localized resources hub.
 *
 * The same three views back two route trees:
 *   - `/resources/*`  → locale "en"
 *   - `/recursos/*`   → locale "es"
 *
 * Each route passes its fixed `locale` and `basePath`; content is filtered
 * strictly by that locale so each hub stays monolingual. The locale is NOT
 * read from the request cookie here — the URL is the source of truth.
 */

type Copy = {
  backHome: string;
  hubHeading: string;
  hubSubtitle: string;
  hubEmpty: string;
  viewAll: (n: number) => string;
  hubMetaTitle: string;
  hubMetaDescription: string;
  hubSuffix: string;
  backToHub: string;
  categoryEmpty: string;
  breadcrumbHub: string;
  updated: string;
  asideTitle: string;
  notFound: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    backHome: "← Continuity",
    hubHeading: "Help center",
    hubSubtitle: "Guides, tutorials, and answers to the most common questions.",
    hubEmpty: "No resources published yet.",
    viewAll: (n) => `View all ${n} resources →`,
    hubMetaTitle: "Help center — Continuity",
    hubMetaDescription:
      "Guides, tutorials, and FAQs to get the most out of Continuity.",
    hubSuffix: "Help center — Continuity",
    backToHub: "← Help center",
    categoryEmpty: "No resources in this category yet.",
    breadcrumbHub: "Help center",
    updated: "Updated",
    asideTitle: "In this category",
    notFound: "Not found",
  },
  es: {
    backHome: "← Continuity",
    hubHeading: "Centro de ayuda",
    hubSubtitle: "Guías, tutoriales y respuestas a las preguntas más frecuentes.",
    hubEmpty: "Todavía no hay recursos publicados.",
    viewAll: (n) => `Ver los ${n} recursos →`,
    hubMetaTitle: "Centro de ayuda — Continuity",
    hubMetaDescription:
      "Guías, tutoriales y respuestas frecuentes para sacarle el máximo provecho a Continuity.",
    hubSuffix: "Centro de ayuda — Continuity",
    backToHub: "← Centro de ayuda",
    categoryEmpty: "Todavía no hay recursos en esta categoría.",
    breadcrumbHub: "Centro de ayuda",
    updated: "Actualizado",
    asideTitle: "En esta categoría",
    notFound: "Not found",
  },
};

export type ResourceRouteConfig = {
  locale: Locale;
  /** URL prefix without trailing slash, e.g. "/resources" or "/recursos". */
  basePath: string;
};

// ---------- Metadata ----------

export function hubMetadata({ locale }: ResourceRouteConfig): Metadata {
  const c = COPY[locale];
  return { title: c.hubMetaTitle, description: c.hubMetaDescription };
}

export async function categoryMetadata(
  { locale }: ResourceRouteConfig,
  category: string
): Promise<Metadata> {
  const c = COPY[locale];
  const cats = await fetchHelpCategories(locale);
  const cat = cats.find((x) => x.slug === category);
  if (!cat) return { title: c.notFound };
  return {
    title: `${cat.name} — ${c.hubSuffix}`,
    description: cat.description || undefined,
  };
}

export async function resourceMetadata(
  { locale }: ResourceRouteConfig,
  slug: string
): Promise<Metadata> {
  const c = COPY[locale];
  const resource = await fetchHelpResource(slug, locale);
  if (!resource) return { title: c.notFound };
  return {
    title: resource.seoTitle || `${resource.title} — ${c.hubSuffix}`,
    description: resource.seoDescription || resource.excerpt || undefined,
    openGraph: {
      title: resource.seoTitle || resource.title,
      description: resource.seoDescription || resource.excerpt || undefined,
      images: resource.coverImageUrl ? [resource.coverImageUrl] : undefined,
      type: "article",
      publishedTime: resource.publishedAt ?? undefined,
    },
  };
}

// ---------- Views ----------

export async function ResourcesHub({ locale, basePath }: ResourceRouteConfig) {
  const c = COPY[locale];
  const [categories, allResources] = await Promise.all([
    fetchHelpCategories(locale),
    fetchHelpResources({ locale, perPage: 50 }),
  ]);

  const resources = allResources?.resources ?? [];
  const resourcesByCategory = new Map<string, typeof resources>();
  for (const r of resources) {
    const list = resourcesByCategory.get(r.categorySlug) ?? [];
    list.push(r);
    resourcesByCategory.set(r.categorySlug, list);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-12">
        <Link href="/" className="text-sm text-accent hover:underline">
          {c.backHome}
        </Link>
        <h1 className="mt-4 text-4xl font-semibold text-text">{c.hubHeading}</h1>
        <p className="mt-2 text-text-muted">{c.hubSubtitle}</p>
      </header>

      {categories.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center text-text-muted">
          {c.hubEmpty}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {categories.map((cat) => {
          const items = (resourcesByCategory.get(cat.slug) ?? []).slice(0, 3);
          return (
            <section
              key={cat.id}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <Link href={`${basePath}/${cat.slug}`} className="group block">
                <h2 className="text-xl font-semibold text-text group-hover:text-accent">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="mt-1 text-sm text-text-muted">
                    {cat.description}
                  </p>
                )}
              </Link>
              <ul className="mt-4 space-y-2">
                {items.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`${basePath}/${cat.slug}/${r.slug}`}
                      className="text-sm text-text hover:text-accent"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`${basePath}/${cat.slug}`}
                className="mt-4 inline-block text-xs text-accent hover:underline"
              >
                {c.viewAll(cat.resourceCount)}
              </Link>
            </section>
          );
        })}
      </div>
    </main>
  );
}

export async function ResourcesCategory(
  { locale, basePath }: ResourceRouteConfig,
  category: string
) {
  const c = COPY[locale];
  const [cats, result] = await Promise.all([
    fetchHelpCategories(locale),
    fetchHelpResources({ locale, categorySlug: category, perPage: 50 }),
  ]);
  const cat = cats.find((x) => x.slug === category);
  if (!cat) notFound();

  const resources = result?.resources ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href={basePath} className="text-sm text-accent hover:underline">
        {c.backToHub}
      </Link>
      <header className="mt-6 mb-10">
        <h1 className="text-3xl font-semibold text-text">{cat.name}</h1>
        {cat.description && (
          <p className="mt-2 text-text-muted">{cat.description}</p>
        )}
      </header>

      {resources.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center text-text-muted">
          {c.categoryEmpty}
        </div>
      )}

      <ul className="space-y-4">
        {resources.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-border bg-surface p-4 hover:border-accent"
          >
            <Link href={`${basePath}/${cat.slug}/${r.slug}`} className="block">
              <h2 className="text-lg font-semibold text-text">{r.title}</h2>
              {r.excerpt && (
                <p className="mt-1 text-sm text-text-muted">{r.excerpt}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export async function ResourceDetail(
  { locale, basePath }: ResourceRouteConfig,
  category: string,
  slug: string
) {
  const c = COPY[locale];
  const resource = await fetchHelpResource(slug, locale);
  if (!resource || resource.categorySlug !== category) {
    notFound();
  }

  const related = await fetchHelpResources({
    locale,
    categorySlug: resource.categorySlug,
    perPage: 6,
  });
  const others = (related?.resources ?? [])
    .filter((r) => r.slug !== slug)
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-center gap-2 text-sm text-accent">
        <Link href={basePath} className="hover:underline">
          {c.breadcrumbHub}
        </Link>
        <span className="text-text-muted">›</span>
        <Link
          href={`${basePath}/${resource.categorySlug}`}
          className="hover:underline"
        >
          {resource.categoryName}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_220px]">
        <article>
          {resource.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resource.coverImageUrl}
              alt=""
              className="mb-8 max-h-96 w-full rounded-lg object-cover"
            />
          )}
          <header className="mb-8">
            <h1 className="text-4xl font-semibold text-text">
              {resource.title}
            </h1>
            {resource.publishedAt && (
              <time
                className="mt-2 block text-sm text-text-muted"
                dateTime={resource.publishedAt}
              >
                {c.updated}{" "}
                {new Date(resource.publishedAt).toLocaleDateString(locale)}
              </time>
            )}
          </header>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: resource.contentHtml }}
          />
        </article>

        {others.length > 0 && (
          <aside className="rounded-lg border border-border bg-surface p-4 lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-xs uppercase tracking-wide text-text-muted">
              {c.asideTitle}
            </h2>
            <ul className="mt-3 space-y-2">
              {others.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`${basePath}/${r.categorySlug}/${r.slug}`}
                    className="text-sm text-text hover:text-accent"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </main>
  );
}
