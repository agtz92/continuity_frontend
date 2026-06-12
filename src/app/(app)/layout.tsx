import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "../providers";

/**
 * Layout for the dynamic tool (dashboard, settings, onboarding, admin,
 * report-bug, login, reset-password).
 *
 * Reads the locale from the `NEXT_LOCALE` cookie (via i18n/request.ts) and
 * feeds it to the client provider — intentionally DYNAMIC, which these routes
 * are anyway (they read the Supabase session from cookies). Theme + palette are
 * applied before paint by the no-flash script in the root layout.
 *
 * The Apollo/Toaster `<Providers>` live here (not in the root layout) so the
 * static marketing pages don't pay for Apollo's bundle.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
