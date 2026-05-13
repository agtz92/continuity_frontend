"use client";

/**
 * Tell the Next.js server to bust public-CMS cache tags after a
 * mutation. Fire-and-forget — failures here just delay cache eviction,
 * which Next.js will do on its own after the `revalidate` interval.
 */
export async function revalidateCmsCache(payload: {
  kind: "post" | "page" | "all";
  slug?: string;
  path?: string;
}): Promise<void> {
  try {
    await fetch("/api/cms/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // intentionally ignored
  }
}
