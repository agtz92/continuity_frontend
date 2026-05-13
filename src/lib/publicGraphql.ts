/**
 * Server-side fetch against the public GraphQL endpoint.
 *
 * The main `/graphql/` endpoint requires a Supabase JWT on every
 * request. The marketing site doesn't have one, so the backend
 * exposes `/public-graphql/` with a separate schema that only allows
 * reads of PUBLISHED content. This helper hits that endpoint with
 * Next.js fetch caching so list views and post pages don't re-query
 * on every request — invalidation happens via `revalidateTag` after
 * publish/unpublish mutations.
 */

const TAGS = {
  blogPosts: "cms:blog-posts",
  blogPost: (slug: string) => `cms:blog-post:${slug}`,
  page: (path: string) => `cms:page:${path}`,
  navPages: "cms:nav-pages",
} as const;

export const PUBLIC_CMS_TAGS = TAGS;

function resolvePublicGraphqlUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_PUBLIC_GRAPHQL_URL;
  if (explicit) return explicit;
  const main = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (main) return main.replace(/\/graphql\/?$/, "/public-graphql/");
  return "http://localhost:8000/public-graphql/";
}

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function publicFetch<T>(
  query: string,
  variables: Record<string, unknown>,
  tags: string[]
): Promise<T | null> {
  const url = resolvePublicGraphqlUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { tags, revalidate: 600 },
  });
  if (!res.ok) {
    console.error("[publicGraphql] HTTP", res.status, await res.text());
    return null;
  }
  const body = (await res.json()) as GraphqlResponse<T>;
  if (body.errors?.length) {
    console.error("[publicGraphql] errors", body.errors);
    return null;
  }
  return body.data ?? null;
}

const POST_FIELDS = `
  id slug title excerpt contentHtml coverImageUrl publishedAt tags
  seoTitle seoDescription locale
`;

const PAGE_FIELDS = `
  id path title excerpt contentHtml coverImageUrl publishedAt
  seoTitle seoDescription locale showInNav navOrder
`;

export type PublicBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string;
  publishedAt: string | null;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  locale: string;
};

export type PublicPage = {
  id: string;
  path: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string;
  publishedAt: string | null;
  seoTitle: string;
  seoDescription: string;
  locale: string;
  showInNav: boolean;
  navOrder: number;
};

export type PublicNavLink = {
  path: string;
  title: string;
  navOrder: number;
};

export async function fetchBlogPosts(
  options: { locale?: string; tag?: string; page?: number; perPage?: number } = {}
): Promise<{
  posts: PublicBlogPost[];
  hasNext: boolean;
  page: number;
  perPage: number;
} | null> {
  const query = `
    query($locale: String, $tag: String, $page: Int, $perPage: Int) {
      publicBlogPosts(locale: $locale, tag: $tag, page: $page, perPage: $perPage) {
        posts { ${POST_FIELDS} }
        page perPage hasNext
      }
    }
  `;
  const data = await publicFetch<{
    publicBlogPosts: {
      posts: PublicBlogPost[];
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }>(
    query,
    {
      locale: options.locale ?? null,
      tag: options.tag ?? null,
      page: options.page ?? 1,
      perPage: options.perPage ?? 20,
    },
    [TAGS.blogPosts]
  );
  return data?.publicBlogPosts ?? null;
}

export async function fetchBlogPost(
  slug: string,
  locale?: string
): Promise<PublicBlogPost | null> {
  const query = `
    query($slug: String!, $locale: String) {
      publicBlogPost(slug: $slug, locale: $locale) { ${POST_FIELDS} }
    }
  `;
  const data = await publicFetch<{ publicBlogPost: PublicBlogPost | null }>(
    query,
    { slug, locale: locale ?? null },
    [TAGS.blogPost(slug), TAGS.blogPosts]
  );
  return data?.publicBlogPost ?? null;
}

export async function fetchPage(
  path: string,
  locale?: string
): Promise<PublicPage | null> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const query = `
    query($path: String!, $locale: String) {
      publicPage(path: $path, locale: $locale) { ${PAGE_FIELDS} }
    }
  `;
  const data = await publicFetch<{ publicPage: PublicPage | null }>(
    query,
    { path: normalized, locale: locale ?? null },
    [TAGS.page(normalized)]
  );
  return data?.publicPage ?? null;
}

export async function fetchNavPages(
  locale?: string
): Promise<PublicNavLink[]> {
  const query = `
    query($locale: String) {
      publicNavPages(locale: $locale) { path title navOrder }
    }
  `;
  const data = await publicFetch<{ publicNavPages: PublicNavLink[] }>(
    query,
    { locale: locale ?? null },
    [TAGS.navPages]
  );
  return data?.publicNavPages ?? [];
}
