import Link from "next/link";
import type { Metadata } from "next";
import { fetchHelpCategories, fetchHelpResources } from "@/lib/publicGraphql";

export const metadata: Metadata = {
  title: "Centro de ayuda — Continuity",
  description:
    "Guías, tutoriales y respuestas frecuentes para sacarle el máximo provecho a Continuity.",
};

export const revalidate = 600;

export default async function AyudaIndexPage() {
  const [categories, allResources] = await Promise.all([
    fetchHelpCategories(),
    fetchHelpResources({ perPage: 50 }),
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
          ← Continuity
        </Link>
        <h1 className="mt-4 text-4xl font-semibold text-text">Centro de ayuda</h1>
        <p className="mt-2 text-text-muted">
          Guías, tutoriales y respuestas a las preguntas más frecuentes.
        </p>
      </header>

      {categories.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center text-text-muted">
          Todavía no hay recursos publicados.
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
              <Link
                href={`/ayuda/${cat.slug}`}
                className="group block"
              >
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
                      href={`/ayuda/${cat.slug}/${r.slug}`}
                      className="text-sm text-text hover:text-accent"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/ayuda/${cat.slug}`}
                className="mt-4 inline-block text-xs text-accent hover:underline"
              >
                Ver los {cat.resourceCount} recursos →
              </Link>
            </section>
          );
        })}
      </div>
    </main>
  );
}
