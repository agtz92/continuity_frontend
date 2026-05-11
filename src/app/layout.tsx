import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Providers } from "./providers";
import { resolveTheme } from "@/theme/resolve";
import { NO_FLASH_SCRIPT } from "@/theme/no-flash";
import { resolvePalette } from "@/palette/resolve";

export const metadata: Metadata = {
  title: "Continuity",
  description: "Don't let your projects quietly die.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const theme = await resolveTheme();
  const palette = await resolvePalette();
  return (
    <html lang={locale} data-theme={theme} data-palette={palette} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
