import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "./config";

/**
 * Resolves the active locale for the current request.
 *
 * Priority:
 *  1. `NEXT_LOCALE` cookie (set by the user via the language selector)
 *  2. `Accept-Language` header (best-effort detection on first visit)
 *  3. DEFAULT_LOCALE
 *
 * The user's persisted DB preference is synced TO the cookie on the client
 * after auth (see hooks/useLocaleSync), so we don't need to call the GraphQL
 * API from the server here.
 */
export default getRequestConfig(async ({ locale: requested }) => {
  // Honor an explicitly-requested locale (e.g. a static page calling
  // `getTranslations({ locale })`) WITHOUT reading cookies — reading cookies
  // here would taint the caller into dynamic rendering. Only fall back to the
  // cookie/header sniff when no explicit locale was passed (the dynamic tool).
  const locale = isLocale(requested) ? requested : await resolveLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});

async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const hdrs = await headers();
  const accept = hdrs.get("accept-language") ?? "";
  const preferred = accept.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  if (isLocale(preferred)) return preferred;

  return DEFAULT_LOCALE;
}
