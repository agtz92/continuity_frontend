import Link from "next/link";
import type { Metadata } from "next";
import { fetchBlogPosts } from "@/lib/publicGraphql";
import { getStaticTranslator } from "@/i18n/static";
import { marketingHref } from "@/i18n/marketingHref";
import type { Locale } from "@/i18n/config";
import MarketingNav from "@/components/landing/MarketingNav";
import MarketingFooter from "@/components/landing/MarketingFooter";

/**
 * Shared blog index, rendered statically per locale.
 *   - English: /blog        (locale "en")
 *   - Spanish: /es/blog     (locale "es")
 * Mirrors the resources hub pattern (ResourcePages.tsx): one implementation,
 * thin per-locale route files pass a fixed `locale`.
 */

export function blogIndexMetadata(locale: Locale): Metadata {
  const t = getStaticTranslator(locale, "landing.blog");
  const canonical = marketingHref(locale, "/blog");
  return {
    title: `${t("title")} — continuu.it`,
    description: t("subtitle"),
    alternates: {
      canonical,
      languages: { en: "/blog", es: "/es/blog", "x-default": "/blog" },
    },
  };
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogIndex({ locale }: { locale: Locale }) {
  const t = getStaticTranslator(locale, "landing.blog");
  const result = await fetchBlogPosts({ locale, perPage: 20 });
  const posts = result?.posts ?? [];
  const [featured, ...rest] = posts;
  const postHref = (slug: string) => marketingHref(locale, `/blog/${slug}`);

  return (
    <div
      data-surface="marketing"
      className="min-h-screen bg-ls-navy text-ls-text-primary font-sans antialiased selection:bg-ls-ochre/30 selection:text-ls-text-primary"
    >
      <MarketingNav />

      <main className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-ls-ochre/10 blur-[140px]" />
          <div className="absolute top-1/3 left-0 h-[360px] w-[520px] rounded-full bg-ls-vermillion/10 blur-[120px]" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12">
          <header className="mb-16 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-ls-text-secondary backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ls-ochre opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ls-ochre" />
              </span>
              {t("eyebrow")}
            </p>
            <h1 className="mt-6 font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-tight font-light text-ls-text-primary">
              {t("title")}
              <span className="text-ls-ochre">.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-ls-text-secondary leading-relaxed">
              {t("subtitle")}
            </p>
          </header>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center text-ls-text-secondary">
              {t("empty")}
            </div>
          ) : (
            <>
              {featured && (
                <Link
                  href={postHref(featured.slug)}
                  className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-ls-ochre/40"
                >
                  <div className="grid lg:grid-cols-5 gap-0">
                    <div className="lg:col-span-2 relative h-64 lg:h-auto lg:min-h-[440px] overflow-hidden">
                      {featured.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={featured.coverImageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-ls-indigo via-ls-navy to-ls-navy" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-ls-ochre/25 via-transparent to-ls-vermillion/15" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-display text-7xl text-ls-ochre/30 select-none">
                              ✦
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="lg:col-span-3 p-8 sm:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-ls-ochre">
                          {t("eyebrow")}
                        </span>
                        {featured.publishedAt && (
                          <>
                            <span className="h-px w-6 bg-white/15" />
                            <time
                              className="text-xs uppercase tracking-[0.18em] text-ls-text-secondary"
                              dateTime={featured.publishedAt}
                            >
                              {formatDate(featured.publishedAt, locale)}
                            </time>
                          </>
                        )}
                      </div>
                      <h2 className="mt-5 font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05] font-light text-ls-text-primary group-hover:text-ls-ochre transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="mt-5 text-ls-text-secondary leading-relaxed">
                          {featured.excerpt}
                        </p>
                      )}
                      <span className="mt-7 inline-flex items-center gap-2 text-sm text-ls-ochre">
                        {t("readMore")}
                        <span
                          aria-hidden
                          className="transition-transform group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <li key={post.id}>
                      <Link
                        href={postHref(post.slug)}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-ls-ochre/40"
                      >
                        <div className="relative h-44 overflow-hidden">
                          {post.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-br from-ls-indigo via-ls-navy to-ls-navy" />
                              <div className="absolute inset-0 bg-gradient-to-tr from-ls-ochre/15 via-transparent to-ls-vermillion/10" />
                            </>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                          {post.publishedAt && (
                            <time
                              className="text-xs uppercase tracking-[0.18em] text-ls-text-secondary"
                              dateTime={post.publishedAt}
                            >
                              {formatDate(post.publishedAt, locale)}
                            </time>
                          )}
                          <h3 className="mt-3 font-display text-2xl leading-snug font-light text-ls-text-primary group-hover:text-ls-ochre transition-colors">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="mt-3 text-sm text-ls-text-secondary leading-relaxed line-clamp-3">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
