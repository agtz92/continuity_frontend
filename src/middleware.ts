import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Subdomain routing for the admin panel.
 *
 * - `admon.continuu.it/*` is rewritten to `/admin/*` internally.
 * - `continuu.it/admin/*` redirects to `admon.continuu.it/admin/*` so the
 *   admin surface is only reachable on its own subdomain.
 *
 * Local dev: hit `admon.localhost:3000` after adding it to your hosts file,
 * or set `NEXT_PUBLIC_ADMIN_HOST=admon.localhost` if you want a different
 * label. The `.localhost` TLD resolves to 127.0.0.1 on most modern OSes.
 */
// Paths that must keep their original namespace even on the admin
// subdomain — login is shared with the main app (so the same Supabase
// session works on both hosts), API routes are universal, and Next.js
// internals must never be rewritten.
const ADMON_PASSTHROUGH = ["/login", "/api/", "/_next/"];

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const url = req.nextUrl.clone();

  const isAdminHost = host.startsWith("admon.");
  const isMainHost = !isAdminHost;

  if (isAdminHost) {
    const path = url.pathname;
    const isPassthrough = ADMON_PASSTHROUGH.some(
      (prefix) => path === prefix.replace(/\/$/, "") || path.startsWith(prefix)
    );
    if (isPassthrough || path.startsWith("/admin")) {
      return NextResponse.next();
    }
    url.pathname = `/admin${path === "/" ? "" : path}`;
    return NextResponse.rewrite(url);
  }

  if (isMainHost && url.pathname.startsWith("/admin")) {
    const target = req.nextUrl.clone();
    target.host = host.replace(/^(www\.)?/, "admon.");
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
