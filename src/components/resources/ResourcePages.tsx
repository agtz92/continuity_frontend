import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchHelpCategories,
  fetchHelpResource,
  fetchHelpResources,
} from "@/lib/publicGraphql";
import type { Locale } from "@/i18n/config";
import MarketingNav from "@/components/landing/MarketingNav";
import MarketingFooter from "@/components/landing/MarketingFooter";

/** Marketing shell shared by every resources view (matches /blog). */
function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div
      data-surface="marketing"
      className="min-h-screen bg-ls-navy text-ls-text-primary font-sans antialiased selection:bg-ls-ochre/30 selection:text-ls-text-primary"
    >
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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
    <MarketingShell>
      <main className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-ls-ochre/10 blur-[140px]" />
          <div className="absolute top-1/3 left-0 h-[360px] w-[520px] rounded-full bg-ls-vermillion/10 blur-[120px]" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12">
          <header className="mb-16 max-w-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-ls-text-secondary transition-colors hover:text-ls-ochre"
            >
              <span aria-hidden>←</span>
              Continuity
            </Link>
            <h1 className="mt-6 font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-tight font-light text-ls-text-primary">
              {c.hubHeading}
              <span className="text-ls-ochre">.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-ls-text-secondary leading-relaxed">
              {c.hubSubtitle}
            </p>
          </header>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center text-ls-text-secondary">
              {c.hubEmpty}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {categories.map((cat) => {
                const items = (resourcesByCategory.get(cat.slug) ?? []).slice(0, 3);
                return (
                  <section
                    key={cat.id}
                    className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-ls-ochre/40"
                  >
                    <Link href={`${basePath}/${cat.slug}`} className="group block">
                      <h2 className="font-display text-2xl font-light text-ls-text-primary transition-colors group-hover:text-ls-ochre">
                        {cat.name}
                      </h2>
                      {cat.description && (
                        <p className="mt-2 text-sm text-ls-text-secondary leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </Link>
                    <ul className="mt-5 space-y-2.5">
                      {items.map((r) => (
                        <li key={r.id}>
                          <Link
                            href={`${basePath}/${cat.slug}/${r.slug}`}
                            className="text-sm text-ls-text-primary/90 transition-colors hover:text-ls-ochre"
                          >
                            {r.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`${basePath}/${cat.slug}`}
                      className="mt-6 inline-flex items-center gap-2 text-sm text-ls-ochre"
                    >
                      {c.viewAll(cat.resourceCount)}
                    </Link>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </MarketingShell>
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
    <MarketingShell>
      <main className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-ls-ochre/10 blur-[140px]" />
          <div className="absolute top-1/3 left-0 h-[360px] w-[520px] rounded-full bg-ls-vermillion/10 blur-[120px]" />
        </div>

        <div className="mx-auto w-full max-w-4xl px-6 sm:px-8 lg:px-12">
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 text-sm text-ls-text-secondary transition-colors hover:text-ls-ochre"
          >
            <span aria-hidden>←</span>
            {c.breadcrumbHub}
          </Link>
          <header className="mt-10 mb-12 max-w-3xl">
            <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.05] tracking-tight font-light text-ls-text-primary">
              {cat.name}
            </h1>
            {cat.description && (
              <p className="mt-6 text-lg text-ls-text-secondary leading-relaxed">
                {cat.description}
              </p>
            )}
          </header>

          {resources.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center text-ls-text-secondary">
              {c.categoryEmpty}
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {resources.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`${basePath}/${cat.slug}/${r.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-ls-ochre/40"
                  >
                    <h2 className="font-display text-xl font-light text-ls-text-primary transition-colors group-hover:text-ls-ochre">
                      {r.title}
                    </h2>
                    {r.excerpt && (
                      <p className="mt-3 text-sm text-ls-text-secondary leading-relaxed line-clamp-3">
                        {r.excerpt}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </MarketingShell>
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
    <MarketingShell>
      <header className="relative pt-32 pb-10 sm:pt-40 sm:pb-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-ls-ochre/10 blur-[140px]" />
          <div className="absolute top-1/2 right-0 h-[360px] w-[480px] rounded-full bg-ls-vermillion/10 blur-[120px]" />
        </div>

        <div className="mx-auto w-full max-w-4xl px-6 sm:px-8 lg:px-12">
          <Link
            href={`${basePath}/${resource.categorySlug}`}
            className="inline-flex items-center gap-2 text-sm text-ls-text-secondary transition-colors hover:text-ls-ochre"
          >
            <span aria-hidden>←</span>
            {resource.categoryName}
          </Link>

          <div className="mt-12 flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.22em] text-ls-ochre">
              {c.breadcrumbHub}
            </span>
            {resource.publishedAt && (
              <>
                <span className="h-px w-6 bg-white/15" />
                <time
                  className="text-xs uppercase tracking-[0.18em] text-ls-text-secondary"
                  dateTime={resource.publishedAt}
                >
                  {c.updated} {formatDate(resource.publishedAt, locale)}
                </time>
              </>
            )}
          </div>

          <h1 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.05] tracking-tight font-light text-ls-text-primary">
            {resource.title}
          </h1>

          {resource.excerpt && (
            <p className="mt-6 text-lg text-ls-text-secondary leading-relaxed">
              {resource.excerpt}
            </p>
          )}
        </div>
      </header>

      {resource.coverImageUrl && (
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-12 mb-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resource.coverImageUrl}
            alt=""
            className="w-full max-h-[520px] rounded-2xl object-cover"
          />
        </div>
      )}

      <article className="pb-24">
        <div className="mx-auto w-full max-w-4xl px-6 sm:px-8 lg:px-12">
          <div
            className="prose prose-invert prose-lg max-w-none
              prose-headings:font-display prose-headings:font-light prose-headings:tracking-tight prose-headings:text-ls-text-primary
              prose-h2:text-3xl sm:prose-h2:text-4xl prose-h2:mt-14 prose-h2:mb-5
              prose-p:text-ls-text-primary/90 prose-p:leading-relaxed
              prose-strong:text-ls-text-primary prose-strong:font-semibold
              prose-em:text-ls-text-primary
              prose-a:text-ls-ochre prose-a:no-underline hover:prose-a:underline
              prose-hr:border-white/10 prose-hr:my-12
              prose-blockquote:border-l-ls-ochre prose-blockquote:text-ls-text-secondary
              prose-li:text-ls-text-primary/90
              prose-code:text-ls-ochre prose-code:before:content-none prose-code:after:content-none
              prose-img:rounded-2xl
            "
            dangerouslySetInnerHTML={{ __html: resource.contentHtml }}
          />

          {others.length > 0 && (
            <section className="mt-16 border-t border-white/10 pt-10">
              <h2 className="text-xs uppercase tracking-[0.18em] text-ls-text-secondary">
                {c.asideTitle}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {others.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`${basePath}/${r.categorySlug}/${r.slug}`}
                      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-ls-ochre/40"
                    >
                      <h3 className="font-display text-lg font-light text-ls-text-primary transition-colors group-hover:text-ls-ochre">
                        {r.title}
                      </h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-12 border-t border-white/10 pt-8">
            <Link
              href={basePath}
              className="inline-flex items-center gap-2 text-sm text-ls-text-secondary transition-colors hover:text-ls-ochre"
            >
              <span aria-hidden>←</span>
              {c.backToHub}
            </Link>
          </div>
        </div>
      </article>
    </MarketingShell>
  );
}
