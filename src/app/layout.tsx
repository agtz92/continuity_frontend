import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "./analytics";
import { NO_FLASH_SCRIPT } from "@/theme/no-flash";
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

/**
 * Root layout — intentionally COOKIE-FREE so it never forces dynamic
 * rendering. Locale/theme/palette are resolved closer to where they're needed:
 *   - Marketing pages: fixed locale from the URL (see `(marketing-en)`/`es`
 *     layouts + `@/i18n/static`). Static.
 *   - The tool: the `(app)` layout reads the cookie locale, and the inline
 *     no-flash script applies theme + palette from cookies before paint.
 *
 * `lang="en"` is the static default; the `/es` marketing subtree corrects it
 * client-side via `SetHtmlLang`.
 *
 * NOTE: the Apollo/Toaster `<Providers>` live in the `(app)` layout, NOT here —
 * marketing pages don't use Apollo, and shipping it to every static page added
 * ~117 KB of JS that hurt mobile (especially Safari iOS).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
