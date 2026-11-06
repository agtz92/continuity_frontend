import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Allow next/image to fetch avatars + public assets from Supabase storage.
// We derive the hostname from NEXT_PUBLIC_SUPABASE_URL when present, so the
// allowlist tracks whichever Supabase project the environment points at.
const supabaseHost = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

// ---------------------------------------------------------------------------
// Content-Security-Policy (security scan of 2026-11-06 flagged it missing).
//
// Built at build time, so changing it — or the kill switch below — needs a
// redeploy. `CSP_MODE` (Vercel env var, server-side only):
//   enforce (default) · report (Report-Only: violations only in the console) · off
//
// `script-src` keeps 'unsafe-inline': the no-flash theme script, gtag's init
// and Next's own inline bootstrap run inline, and nonces would force every
// page to render dynamically (marketing is static/ISR — see CLAUDE.md). The
// policy still blocks scripts from any host not listed, plugins, <base>
// hijacking, framing by other sites and requests to unknown APIs.
//
// Adding a third party (script, API, iframe)? Add its host here or it breaks
// silently with a CSP error in the browser console.
// ---------------------------------------------------------------------------
const isDev = process.env.NODE_ENV !== "production";

function origin(raw) {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

const supabaseOrigin = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const apiOrigins = [
  origin(process.env.NEXT_PUBLIC_GRAPHQL_URL),
  origin(process.env.NEXT_PUBLIC_PUBLIC_GRAPHQL_URL),
].filter(Boolean);

// RevenueCat Web Billing (`@revenuecat/purchases-js`) renders its checkout with
// Stripe Elements, which lives in Stripe iframes and talks to Stripe's APIs.
const BILLING = [
  "https://*.revenuecat.com",
  "https://js.stripe.com",
  "https://*.stripe.com",
  "https://*.stripe.network",
];
const GOOGLE_ANALYTICS = [
  "https://www.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
];

const join = (...parts) => [...new Set(parts.flat().filter(Boolean))].join(" ");

const contentSecurityPolicy = [
  `default-src 'self'`,
  `script-src ${join("'self'", "'unsafe-inline'", isDev && "'unsafe-eval'", GOOGLE_ANALYTICS, BILLING)}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `media-src 'self' blob: https:`,
  `connect-src ${join(
    "'self'",
    apiOrigins,
    supabaseOrigin,
    supabaseOrigin?.replace(/^http/, "ws"),
    "https://*.supabase.co",
    "wss://*.supabase.co",
    GOOGLE_ANALYTICS,
    BILLING,
    isDev && ["ws:", "http://localhost:*"],
  )}`,
  // CMS embeds (backend/core/cms/rendering.py `_ALLOWED_EMBED_HOSTS`) + checkout.
  `frame-src ${join(
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://player.vimeo.com",
    BILLING,
  )}`,
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  !isDev && `upgrade-insecure-requests`,
]
  .filter(Boolean)
  .join("; ");

const cspMode = (process.env.CSP_MODE || "enforce").toLowerCase();
const cspHeader =
  cspMode === "off"
    ? null
    : {
        key:
          cspMode === "report"
            ? "Content-Security-Policy-Report-Only"
            : "Content-Security-Policy",
        value: contentSecurityPolicy,
      };

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...(cspHeader ? [cspHeader] : []),
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  images: {
    // `*.supabase.co` stays allowed even with the custom domain: URLs saved
    // before the switch (CMS media, covers) still point at the project ref.
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https",
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
