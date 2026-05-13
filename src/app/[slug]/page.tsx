import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPage } from "@/lib/publicGraphql";

export const revalidate = 600;

// Slugs reserved by app/ folders — Next.js routes static segments
// before dynamic ones, but we also guard here to be defensive.
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "blog",
  "login",
  "settings",
  "_next",
]);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) return { title: "Not found" };
  const page = await fetchPage(slug);
  if (!page) return { title: "Not found" };
  return {
    title: page.seoTitle || `${page.title} — Continuity`,
    description: page.seoDescription || page.excerpt || undefined,
  };
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) notFound();
  const page = await fetchPage(slug);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Continuity
      </Link>
      <article className="mt-6">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-text">{page.title}</h1>
          {page.excerpt && (
            <p className="mt-2 text-text-muted">{page.excerpt}</p>
          )}
        </header>
        {page.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.coverImageUrl}
            alt=""
            className="mb-8 max-h-96 w-full rounded-lg object-cover"
          />
        )}
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.contentHtml }}
        />
      </article>
    </main>
  );
}
