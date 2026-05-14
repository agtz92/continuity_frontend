import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { __resetToastsForTests } from "@/lib/toast";

// jsdom doesn't implement matchMedia. Components that branch on viewport
// (e.g. useIsMobile) call it during render — stub it to default to desktop.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// Mock Supabase globally so no test ever reaches the real client. Any
// test that needs different behavior can `vi.mocked(supabase.auth...)`.
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Stub `next/navigation` so components calling useRouter()/usePathname()
// don't hit the "App Router not mounted" invariant under jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Stub `next-intl` so translated components can render in tests without
// a NextIntlClientProvider. We resolve actual English strings from
// messages/en.json so existing tests can keep asserting visible text
// (e.g. "Capture Idea") without coupling to translation keys.
import enMessages from "./messages/en.json";

const _resolve = (path: string): unknown => {
  const parts = path.split(".");
  let cur: unknown = enMessages;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
};

const _interpolate = (
  template: string,
  params?: Record<string, unknown>
): string => {
  if (!params) return template;
  // Handles both `{name}` and `{count, plural, one {x} other {y}}` ICU forms
  return template
    .replace(
      /\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g,
      (_, name, one, other) => {
        const v = Number(params[name]);
        const tpl = v === 1 ? one : other;
        return tpl.replace(/#/g, String(v));
      }
    )
    .replace(/\{(\w+)\}/g, (_, name) =>
      params[name] != null ? String(params[name]) : ""
    );
};

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) =>
    (key: string, params?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const value = _resolve(fullKey);
      if (typeof value === "string") return _interpolate(value, params);
      return key;
    },
  useLocale: () => "en",
}));

// `useLocaleSync` queries Apollo and calls server actions; in tests just no-op.
vi.mock("@/hooks/useLocaleSync", () => ({
  useLocaleSync: () => {},
}));

// Server actions can't be imported into jsdom; stub the module.
vi.mock("@/i18n/actions", () => ({
  setLocale: vi.fn().mockResolvedValue(undefined),
}));

// `confirm()` is used by the Dashboard for destructive actions. jsdom
// doesn't implement it; default to "yes" so tests don't hang.
beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  __resetToastsForTests();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
