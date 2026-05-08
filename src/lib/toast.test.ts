import { describe, it, expect, vi } from "vitest";
import { toast, subscribeToasts, type Toast } from "./toast";

describe("toast bus", () => {
  it("pushes a toast and notifies subscribers", () => {
    const seen: Toast[][] = [];
    const unsub = subscribeToasts((t) => seen.push(t));

    toast.error("boom");

    // Initial empty snapshot + the new error toast.
    expect(seen.length).toBeGreaterThanOrEqual(2);
    const last = seen[seen.length - 1];
    expect(last).toHaveLength(1);
    expect(last[0]).toMatchObject({ kind: "error", message: "boom" });

    unsub();
  });

  it("supports success and info kinds", () => {
    const captured: Toast[] = [];
    subscribeToasts((t) => captured.splice(0, captured.length, ...t));

    toast.success("ok");
    expect(captured.at(-1)?.kind).toBe("success");
    toast.info("hi");
    expect(captured.at(-1)?.kind).toBe("info");
  });

  it("dismisses by id", () => {
    let snapshot: Toast[] = [];
    subscribeToasts((t) => (snapshot = t));

    const id = toast.error("x");
    expect(snapshot).toHaveLength(1);
    toast.dismiss(id);
    expect(snapshot).toHaveLength(0);
  });

  it("auto-dismisses after the TTL", async () => {
    vi.useFakeTimers();
    let snapshot: Toast[] = [];
    subscribeToasts((t) => (snapshot = t));

    toast.error("vanish", 100);
    expect(snapshot).toHaveLength(1);

    vi.advanceTimersByTime(150);
    expect(snapshot).toHaveLength(0);

    vi.useRealTimers();
  });

  it("stops calling unsubscribed listeners", () => {
    const listener = vi.fn();
    const unsub = subscribeToasts(listener);
    listener.mockClear();
    unsub();

    toast.error("ignored");
    expect(listener).not.toHaveBeenCalled();
  });
});
