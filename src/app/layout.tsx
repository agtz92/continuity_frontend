import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "./analytics";
import { Providers } from "./providers";
import { resolveTheme } from "@/theme/resolve";
import { NO_FLASH_SCRIPT } from "@/theme/no-flash";
import { resolvePalette } from "@/palette/resolve";
import { resolveSiteUrl } from "@/lib/siteUrl";

const fontDisplay = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["SOFT", "WONK", "opsz"],
});

const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const SITE_URL = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "continuu.it — Finish what you start",
    template: "%s — continuu.it",
  },
  description:
    "The project manager for people who start more than they finish. Built for founders, freelancers, and side-project builders.",
  applicationName: "continuu.it",
  openGraph: {
    type: "website",
    siteName: "continuu.it",
    url: SITE_URL,
    title: "continuu.it — Finish what you start",
    description:
      "The project manager for people who start more than they finish.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "continuu.it — Finish what you start",
    description:
      "The project manager for people who start more than they finish.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
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
    <html
      lang={locale}
      data-theme={theme}
      data-palette={palette}
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>
        <Analytics />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
