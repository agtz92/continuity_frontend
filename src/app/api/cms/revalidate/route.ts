import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { PUBLIC_CMS_TAGS } from "@/lib/publicGraphql";

/**
 * Internal revalidation endpoint called by the admin UI after a CMS
 * mutation succeeds.
 *
 * Body: { kind: "post" | "page" | "all", slug?: string, path?: string }
 *
 * No auth check here — the endpoint only busts cache tags, it doesn't
 * mutate data. Misuse just causes extra fetches against the public
 * GraphQL endpoint on the next request. If that becomes a problem we
 * can add a shared-secret header.
 */
export async function POST(request: Request) {
  let body: {
    kind?: string;
    slug?: string;
    path?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const tagsHit: string[] = [];

  switch (body.kind) {
    case "post": {
      tagsHit.push(PUBLIC_CMS_TAGS.blogPosts);
      if (body.slug) {
        tagsHit.push(PUBLIC_CMS_TAGS.blogPost(body.slug));
      }
      break;
    }
    case "page": {
      tagsHit.push(PUBLIC_CMS_TAGS.navPages);
      if (body.path) {
        const normalized = body.path.startsWith("/") ? body.path : `/${body.path}`;
        tagsHit.push(PUBLIC_CMS_TAGS.page(normalized));
      }
      break;
    }
    case "all": {
      tagsHit.push(
        PUBLIC_CMS_TAGS.blogPosts,
        PUBLIC_CMS_TAGS.navPages
      );
      break;
    }
    default:
      return NextResponse.json(
        { ok: false, error: "Unknown kind" },
        { status: 400 }
      );
  }

  tagsHit.forEach((tag) => revalidateTag(tag));
  return NextResponse.json({ ok: true, revalidated: tagsHit });
}
