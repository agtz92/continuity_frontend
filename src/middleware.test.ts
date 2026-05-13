/**
 * Subdomain routing behavior.
 *
 * The middleware translates the public host (continuu.it vs.
 * admon.continuu.it) into a path namespace inside the same Next.js
 * deployment. Three rules:
 *
 *   1. `admon.*` GET `/` → rewrite to `/admin`.
 *   2. `admon.*` GET `/foo` → rewrite to `/admin/foo`.
 *   3. `continuu.it` GET `/admin/*` → redirect to admon.continuu.it.
 *   4. Anything else passes through.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => {
  class FakeUrl {
    href: string;
    pathname: string;
    host: string;
    searchParams = new URLSearchParams();

    constructor(href: string) {
      this.href = href;
      const u = new URL(href);
      this.pathname = u.pathname;
      this.host = u.host;
    }
    clone() {
      return new FakeUrl(`https://${this.host}${this.pathname}`);
    }
  }

  return {
    NextResponse: {
      next: () => ({ kind: "next" }),
      rewrite: (url: FakeUrl) => ({
        kind: "rewrite",
        pathname: url.pathname,
        host: url.host,
      }),
      redirect: (url: FakeUrl) => ({
        kind: "redirect",
        pathname: url.pathname,
        host: url.host,
      }),
    },
  };
});

import { middleware } from "./middleware";

function makeReq(host: string, pathname: string) {
  return {
    headers: new Map([["host", host]]) as unknown as Headers,
    nextUrl: new URL(`https://${host}${pathname}`) as any,
  } as any;
}

// Patch the Map-as-Headers stub so .get works
function makeReqProper(host: string, pathname: string) {
  return {
    headers: {
      get: (key: string) => (key.toLowerCase() === "host" ? host : null),
    },
    nextUrl: {
      pathname,
      host,
      clone() {
        return {
          host: this.host,
          pathname: this.pathname,
        } as any;
      },
    } as any,
  } as any;
}

describe("admin subdomain middleware", () => {
  it("rewrites admon root to /admin", () => {
    const res = middleware(makeReqProper("admon.continuu.it", "/"));
    expect(res).toMatchObject({ kind: "rewrite", pathname: "/admin" });
  });

  it("rewrites admon path to /admin/path", () => {
    const res = middleware(makeReqProper("admon.continuu.it", "/users"));
    expect(res).toMatchObject({ kind: "rewrite", pathname: "/admin/users" });
  });

  it("does not double-rewrite if /admin is already in path", () => {
    const res = middleware(makeReqProper("admon.continuu.it", "/admin/users"));
    expect(res).toEqual({ kind: "next" });
  });

  it("redirects /admin from main host to admon subdomain", () => {
    const res = middleware(makeReqProper("continuu.it", "/admin/users"));
    expect(res).toMatchObject({
      kind: "redirect",
      host: "admon.continuu.it",
    });
  });

  it("lets non-admin paths pass on main host", () => {
    const res = middleware(makeReqProper("continuu.it", "/blog/hi"));
    expect(res).toEqual({ kind: "next" });
  });

  it("strips www. prefix when redirecting", () => {
    const res = middleware(makeReqProper("www.continuu.it", "/admin"));
    expect(res).toMatchObject({
      kind: "redirect",
      host: "admon.continuu.it",
    });
  });

  it("lets /login pass through on admon (shared with main app)", () => {
    const res = middleware(makeReqProper("admon.continuu.it", "/login"));
    expect(res).toEqual({ kind: "next" });
  });

  it("lets /api/* pass through on admon", () => {
    const res = middleware(
      makeReqProper("admon.continuu.it", "/api/cms/revalidate")
    );
    expect(res).toEqual({ kind: "next" });
  });
});
