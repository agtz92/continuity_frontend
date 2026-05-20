import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { fetchBlogPost } from "@/lib/publicGraphql";
import MarketingNav from "@/components/landing/MarketingNav";
import MarketingFooter from "@/components/landing/MarketingFooter";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.seoTitle || `${post.title} — continuu.it`,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("landing.blog");
  const post = await fetchBlogPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <div
      data-surface="marketing"
      className="min-h-screen bg-ls-navy text-ls-text-primary font-sans antialiased selection:bg-ls-ochre/30 selection:text-ls-text-primary"
    >
      <MarketingNav />

      <header className="relative pt-32 pb-10 sm:pt-40 sm:pb-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-ls-ochre/10 blur-[140px]" />
          <div className="absolute top-1/2 right-0 h-[360px] w-[480px] rounded-full bg-ls-vermillion/10 blur-[120px]" />
        </div>

        <div className="mx-auto w-full max-w-4xl px-6 sm:px-8 lg:px-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-ls-text-secondary transition-colors hover:text-ls-ochre"
          >
            <span aria-hidden>←</span>
            {t("backToBlog")}
          </Link>

          <div className="mt-12 flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.22em] text-ls-ochre">
              {t("eyebrow")}
            </span>
            {post.publishedAt && (
              <>
                <span className="h-px w-6 bg-white/15" />
                <time
                  className="text-xs uppercase tracking-[0.18em] text-ls-text-secondary"
                  dateTime={post.publishedAt}
                >
                  {formatDate(post.publishedAt, locale)}
                </time>
              </>
            )}
          </div>

          <h1 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.05] tracking-tight font-light text-ls-text-primary">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-6 text-lg text-ls-text-secondary leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {post.tags.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wide text-ls-text-secondary"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {post.coverImageUrl && (
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-12 mb-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
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
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          <div className="mt-16 border-t border-white/10 pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-ls-text-secondary transition-colors hover:text-ls-ochre"
            >
              <span aria-hidden>←</span>
              {t("backToBlog")}
            </Link>
          </div>
        </div>
      </article>

      <MarketingFooter />
    </div>
  );
}
