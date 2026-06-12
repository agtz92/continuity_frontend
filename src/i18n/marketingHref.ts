import type { Locale } from "./config";

/**
 * Localize a MARKETING href for the current locale.
 *
 * English marketing lives at bare paths (`/`, `/blog`, `/privacy`, …); Spanish
 * lives under `/es` (`/es`, `/es/blog`, …). The help center keeps its
 * translated roots (`/resources` ↔ `/recursos`). Anchors to the home section
 * (`/#features`) become `/es#features` so they target the Spanish landing.
 *
 * Only pass MARKETING paths here. Auth/tool routes (`/login`, `/dashboard`)
 * are English-only and must be left literal — do not run them through this.
 */
export function marketingHref(locale: Locale, path: string): string {
  if (locale !== "es") return path;
  if (path === "/") return "/es";
  if (path === "/resources" || path.startsWith("/resources/")) {
    return path.replace("/resources", "/recursos");
  }
  if (path.startsWith("/#")) return `/es${path.slice(1)}`; // "/#x" → "/es#x"
  if (path.startsWith("/")) return `/es${path}`;
  return path;
}

/**
 * Map the current marketing pathname to its counterpart in `target` locale,
 * for the language switcher. Preserves the sub-path where possible.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  // Normalize to the bare (English) path first.
  let bare = pathname;
  if (pathname === "/es") bare = "/";
  else if (pathname.startsWith("/es/")) bare = pathname.slice(3);
  else if (pathname === "/recursos") bare = "/resources";
  else if (pathname.startsWith("/recursos/")) {
    bare = pathname.replace("/recursos", "/resources");
  }
  return marketingHref(target, bare);
}
