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
