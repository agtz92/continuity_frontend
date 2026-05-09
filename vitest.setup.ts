import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { __resetToastsForTests } from "@/lib/toast";

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
// a NextIntlClientProvider. `t("foo")` returns "foo" so assertions on
// visible text stay simple.
vi.mock("next-intl", () => ({
  useTranslations:
    (_namespace?: string) =>
    (key: string, _params?: Record<string, unknown>) =>
      key,
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
