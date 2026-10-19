import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRefetchOnFocus } from "./useRefetchOnFocus";
import { useDayKey } from "./useDayKey";

const setVisibility = (state: "visible" | "hidden") =>
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });

describe("useRefetchOnFocus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });
  afterEach(() => vi.useRealTimers());

  it("refetches on focus, but not twice inside the minimum gap", () => {
    const refetch = vi.fn();
    renderHook(() => useRefetchOnFocus(refetch, { minGapMs: 15_000 }));

    act(() => {
      vi.advanceTimersByTime(16_000);
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(16_000);
      window.dispatchEvent(new Event("online"));
    });
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it("does nothing while the tab is hidden", () => {
    const refetch = vi.fn();
    renderHook(() => useRefetchOnFocus(refetch, { minGapMs: 0, pollMs: 1_000 }));
    setVisibility("hidden");
    act(() => {
      vi.advanceTimersByTime(5_000);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it("polls while visible when pollMs is set", () => {
    const refetch = vi.fn();
    renderHook(() => useRefetchOnFocus(refetch, { minGapMs: 0, pollMs: 1_000 }));
    act(() => {
      vi.advanceTimersByTime(3_100);
    });
    expect(refetch).toHaveBeenCalledTimes(3);
  });

  it("is inert when disabled", () => {
    const refetch = vi.fn();
    renderHook(() =>
      useRefetchOnFocus(refetch, { minGapMs: 0, pollMs: 1_000, enabled: false }),
    );
    act(() => {
      vi.advanceTimersByTime(3_000);
      window.dispatchEvent(new Event("focus"));
    });
    expect(refetch).not.toHaveBeenCalled();
  });
});

describe("useDayKey", () => {
  afterEach(() => vi.useRealTimers());

  it("rolls over to the new date at local midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 19, 23, 59, 30));
    const { result } = renderHook(() => useDayKey());
    expect(result.current).toBe("2026-10-19");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current).toBe("2026-10-20");
  });
});
