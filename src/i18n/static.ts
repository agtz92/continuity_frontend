import { createTranslator } from "next-intl";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import type { Locale } from "./config";

/**
 * Request-independent i18n for the STATIC marketing pages.
 *
 * The dynamic tool resolves locale from the `NEXT_LOCALE` cookie via
 * `i18n/request.ts` (`getLocale`/`getMessages`/`getTranslations`). Those read
 * cookies, which would opt every route into dynamic rendering. Marketing pages
 * instead carry a FIXED locale from the URL (English at bare paths, Spanish
 * under `/es`), so they import the message catalogs directly here and never
 * touch the request — letting Next prerender them statically.
 *
 * - `getMessagesFor(locale)` feeds `<NextIntlClientProvider>` in the per-locale
 *   marketing layouts (so client components' `useTranslations` keep working).
 * - `getStaticTranslator(locale, namespace)` is the synchronous server-side
 *   equivalent of `getTranslations` for metadata/render in marketing pages.
 */

/** next-intl's base message shape (the repo has no global `Messages` augmentation). */
type IntlMessages = { [key: string]: string | IntlMessages };

const MESSAGES = { en, es } as unknown as Record<Locale, IntlMessages>;

export function getMessagesFor(locale: Locale): IntlMessages {
  return MESSAGES[locale];
}

export function getStaticTranslator(locale: Locale, namespace?: string) {
  return createTranslator({ locale, messages: MESSAGES[locale], namespace });
}
