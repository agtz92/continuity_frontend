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
  helpCategories: "cms:help-categories",
  helpResources: "cms:help-resources",
  helpResource: (slug: string) => `cms:help-resource:${slug}`,
  helpCategoryResources: (slug: string) => `cms:help-category:${slug}`,
  platformStats: "public:platform-stats",
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
  tags: string[],
  revalidate: number = 600
): Promise<T | null> {
  const url = resolvePublicGraphqlUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { tags, revalidate },
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

// List views (index/related) render only the card metadata — never the body.
// Omitting contentHtml here lets the backend defer that column and keeps the
// payload small; the detail fetchers still request POST_FIELDS in full.
const POST_LIST_FIELDS = `
  id slug title excerpt coverImageUrl publishedAt tags locale
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
        posts { ${POST_LIST_FIELDS} }
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

export type PublicHelpCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  locale: string;
  resourceCount: number;
};

export type PublicHelpResource = {
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
  categorySlug: string;
  categoryName: string;
};

const HELP_CATEGORY_FIELDS = `
  id slug name description icon order locale resourceCount
`;

const HELP_RESOURCE_FIELDS = `
  id slug title excerpt contentHtml coverImageUrl publishedAt tags
  seoTitle seoDescription locale categorySlug categoryName
`;

// Hub/category/related lists never render the body — see POST_LIST_FIELDS.
const HELP_RESOURCE_LIST_FIELDS = `
  id slug title excerpt coverImageUrl publishedAt tags locale
  categorySlug categoryName
`;

export async function fetchHelpCategories(
  locale?: string
): Promise<PublicHelpCategory[]> {
  const query = `
    query($locale: String) {
      publicHelpCategories(locale: $locale) { ${HELP_CATEGORY_FIELDS} }
    }
  `;
  const data = await publicFetch<{ publicHelpCategories: PublicHelpCategory[] }>(
    query,
    { locale: locale ?? null },
    [TAGS.helpCategories]
  );
  return data?.publicHelpCategories ?? [];
}

export async function fetchHelpResources(
  options: {
    locale?: string;
    categorySlug?: string;
    page?: number;
    perPage?: number;
  } = {}
): Promise<{
  resources: PublicHelpResource[];
  hasNext: boolean;
  page: number;
  perPage: number;
} | null> {
  const query = `
    query($locale: String, $categorySlug: String, $page: Int, $perPage: Int) {
      publicHelpResources(
        locale: $locale
        categorySlug: $categorySlug
        page: $page
        perPage: $perPage
      ) {
        resources { ${HELP_RESOURCE_LIST_FIELDS} }
        page perPage hasNext
      }
    }
  `;
  const tags: string[] = [TAGS.helpResources];
  if (options.categorySlug) {
    tags.push(TAGS.helpCategoryResources(options.categorySlug));
  }
  const data = await publicFetch<{
    publicHelpResources: {
      resources: PublicHelpResource[];
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }>(
    query,
    {
      locale: options.locale ?? null,
      categorySlug: options.categorySlug ?? null,
      page: options.page ?? 1,
      perPage: options.perPage ?? 20,
    },
    tags
  );
  return data?.publicHelpResources ?? null;
}

export type PublicPlatformStats = {
  userCount: number;
};

export async function fetchPlatformStats(): Promise<PublicPlatformStats> {
  const query = `
    query {
      publicPlatformStats { userCount }
    }
  `;
  // Short revalidate window — the backend already caches 5 min, so the
  // frontend cache just adds dev-iteration friction without much gain.
  const data = await publicFetch<{ publicPlatformStats: PublicPlatformStats }>(
    query,
    {},
    [TAGS.platformStats],
    30
  );
  return data?.publicPlatformStats ?? { userCount: 0 };
}

export async function fetchHelpResource(
  slug: string,
  locale?: string
): Promise<PublicHelpResource | null> {
  const query = `
    query($slug: String!, $locale: String) {
      publicHelpResource(slug: $slug, locale: $locale) {
        ${HELP_RESOURCE_FIELDS}
      }
    }
  `;
  const data = await publicFetch<{ publicHelpResource: PublicHelpResource | null }>(
    query,
    { slug, locale: locale ?? null },
    [TAGS.helpResource(slug), TAGS.helpResources]
  );
  return data?.publicHelpResource ?? null;
}
