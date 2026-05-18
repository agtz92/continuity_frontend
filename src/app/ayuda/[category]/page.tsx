import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchHelpCategories, fetchHelpResources } from "@/lib/publicGraphql";

export const revalidate = 600;

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cats = await fetchHelpCategories();
  const cat = cats.find((c) => c.slug === category);
  if (!cat) return { title: "Not found" };
  return {
    title: `${cat.name} — Centro de ayuda — Continuity`,
    description: cat.description || undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const [cats, result] = await Promise.all([
    fetchHelpCategories(),
    fetchHelpResources({ categorySlug: category, perPage: 50 }),
  ]);
  const cat = cats.find((c) => c.slug === category);
  if (!cat) notFound();

  const resources = result?.resources ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/ayuda" className="text-sm text-accent hover:underline">
        ← Centro de ayuda
      </Link>
      <header className="mt-6 mb-10">
        <h1 className="text-3xl font-semibold text-text">{cat.name}</h1>
        {cat.description && (
          <p className="mt-2 text-text-muted">{cat.description}</p>
        )}
      </header>

      {resources.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center text-text-muted">
          Todavía no hay recursos en esta categoría.
        </div>
      )}

      <ul className="space-y-4">
        {resources.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-border bg-surface p-4 hover:border-accent"
          >
            <Link href={`/ayuda/${cat.slug}/${r.slug}`} className="block">
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
