import { NextIntlClientProvider } from "next-intl";
import { getMessagesFor } from "@/i18n/static";

// Marketing carries a fixed locale from the URL and never reads cookies, so opt
// the whole subtree into static rendering. next-intl otherwise defaults these
// routes to dynamic when its provider is used without a per-request locale;
// `force-static` also guards against accidentally introducing a dynamic API.
export const dynamic = "force-static";

/**
 * English marketing layout (route group — no URL segment).
 *
 * Feeds the client provider with statically-imported English messages, so the
 * marketing client components (`useTranslations`/`useLocale`) work WITHOUT
 * reading cookies. This keeps `/`, `/blog`, `/welcome`, `/privacy`, `/terms`,
 * `/[slug]` and `/resources/*` statically renderable.
 */
export default function MarketingEnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider locale="en" messages={getMessagesFor("en")}>
      {children}
    </NextIntlClientProvider>
  );
}
