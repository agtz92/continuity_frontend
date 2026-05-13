import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchBlogPost } from "@/lib/publicGraphql";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.seoTitle || `${post.title} — Continuity`,
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/blog" className="text-sm text-accent hover:underline">
        ← Volver al blog
      </Link>

      <article className="mt-6">
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            className="mb-8 max-h-96 w-full rounded-lg object-cover"
          />
        )}
        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-text">{post.title}</h1>
          {post.publishedAt && (
            <time
              className="mt-2 block text-sm text-text-muted"
              dateTime={post.publishedAt}
            >
              {new Date(post.publishedAt).toLocaleDateString()}
            </time>
          )}
          {post.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <li
                  key={t}
                  className="rounded bg-surface px-2 py-0.5 text-xs uppercase text-text-muted"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
        </header>
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </main>
  );
}
