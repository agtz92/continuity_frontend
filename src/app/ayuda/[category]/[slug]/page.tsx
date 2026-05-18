import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchHelpResource, fetchHelpResources } from "@/lib/publicGraphql";

export const revalidate = 600;

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = await fetchHelpResource(slug);
  if (!resource) return { title: "Not found" };
  return {
    title: resource.seoTitle || `${resource.title} — Centro de ayuda — Continuity`,
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

export default async function HelpResourcePage({ params }: Props) {
  const { category, slug } = await params;
  const resource = await fetchHelpResource(slug);
  if (!resource || resource.categorySlug !== category) {
    notFound();
  }

  const related = await fetchHelpResources({
    categorySlug: resource.categorySlug,
    perPage: 6,
  });
  const others = (related?.resources ?? []).filter((r) => r.slug !== slug).slice(0, 5);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-center gap-2 text-sm text-accent">
        <Link href="/ayuda" className="hover:underline">
          Centro de ayuda
        </Link>
        <span className="text-text-muted">›</span>
        <Link href={`/ayuda/${resource.categorySlug}`} className="hover:underline">
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
            <h1 className="text-4xl font-semibold text-text">{resource.title}</h1>
            {resource.publishedAt && (
              <time
                className="mt-2 block text-sm text-text-muted"
                dateTime={resource.publishedAt}
              >
                Actualizado {new Date(resource.publishedAt).toLocaleDateString()}
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
              En esta categoría
            </h2>
            <ul className="mt-3 space-y-2">
              {others.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/ayuda/${r.categorySlug}/${r.slug}`}
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
