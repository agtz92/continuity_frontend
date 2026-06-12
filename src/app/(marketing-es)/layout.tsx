import { NextIntlClientProvider } from "next-intl";
import { getMessagesFor } from "@/i18n/static";
import SetHtmlLang from "@/components/landing/SetHtmlLang";

// See the English marketing layout: fixed locale from the URL, no cookies →
// force the `/es/*` and `/recursos/*` subtree to static rendering.
export const dynamic = "force-static";

/**
 * Spanish marketing layout (route group — no URL segment).
 *
 * Holds the `/es/*` prefixed pages and the `/recursos/*` help center. Feeds the
 * client provider with statically-imported Spanish messages (no cookies →
 * static). `SetHtmlLang` corrects `<html lang>` to "es" on the client (the
 * static root emits "en"); crawlers get the right signal via hreflang.
 */
export default function MarketingEsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider locale="es" messages={getMessagesFor("es")}>
      <SetHtmlLang lang="es" />
      {children}
    </NextIntlClientProvider>
  );
}
