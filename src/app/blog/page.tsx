import Link from "next/link";
import type { Metadata } from "next";
import { fetchBlogPosts } from "@/lib/publicGraphql";

export const metadata: Metadata = {
  title: "Blog — Continuity",
  description:
    "Notas y actualizaciones sobre cómo no dejar morir tus proyectos.",
};

export const revalidate = 600;

export default async function BlogIndexPage() {
  const result = await fetchBlogPosts({ perPage: 20 });
  const posts = result?.posts ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <Link href="/" className="text-sm text-accent hover:underline">
          ← Continuity
        </Link>
        <h1 className="mt-4 text-4xl font-semibold text-text">Blog</h1>
        <p className="mt-2 text-text-muted">
          Pensamientos sobre cómo mantener proyectos vivos.
        </p>
      </header>

      {posts.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center text-text-muted">
          Todavía no hay entradas publicadas.
        </div>
      )}

      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.id} className="border-b border-border pb-8 last:border-b-0">
            <Link href={`/blog/${post.slug}`} className="group block">
              {post.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImageUrl}
                  alt=""
                  className="mb-4 max-h-64 w-full rounded-lg object-cover"
                />
              )}
              <h2 className="text-2xl font-semibold text-text group-hover:text-accent">
                {post.title}
              </h2>
              {post.publishedAt && (
                <time
                  className="mt-1 block text-xs uppercase tracking-wide text-text-muted"
                  dateTime={post.publishedAt}
                >
                  {new Date(post.publishedAt).toLocaleDateString()}
                </time>
              )}
              {post.excerpt && (
                <p className="mt-3 text-text-muted">{post.excerpt}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
