/**
 * Unit tests for useProjectLifecycle (extracted from Dashboard, see
 * AUDITORIA_CODIGO.md): pause/kill transitions route to the closure ritual;
 * everything else saves directly.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectLifecycle } from "./useProjectLifecycle";

type Args = { id?: string | null; name: string; status?: string | null };

describe("useProjectLifecycle", () => {
  it("routes a pause transition to the closure ritual instead of saving", async () => {
    const saveProject = vi.fn().mockResolvedValue(true);
    const onClosureSaved = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle<Args>(saveProject, onClosureSaved)
    );
    let ret: boolean | undefined;
    await act(async () => {
      ret = await result.current.requestSaveProject(
        { id: "p", name: "X", status: "paused" },
        "active"
      );
    });
    expect(ret).toBe(false);
    expect(saveProject).not.toHaveBeenCalled();
    expect(result.current.closure?.mode).toBe("pause");
  });

  it("saves directly when status does not change", async () => {
    const saveProject = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useProjectLifecycle<Args>(saveProject, vi.fn())
    );
    let ret: boolean | undefined;
    await act(async () => {
      ret = await result.current.requestSaveProject(
        { id: "p", name: "X", status: "active" },
        "active"
      );
    });
    expect(ret).toBe(true);
    expect(saveProject).toHaveBeenCalledTimes(1);
  });

  it("handleClosureConfirm merges notes, saves, and calls onClosureSaved", async () => {
    const saveProject = vi.fn().mockResolvedValue(true);
    const onClosureSaved = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle<Args>(saveProject, onClosureSaved)
    );
    await act(async () => {
      await result.current.requestSaveProject(
        { id: "p", name: "X", status: "killed" },
        "active"
      );
    });
    await act(async () => {
      await result.current.handleClosureConfirm({ status: "killed" });
    });
    expect(saveProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p", status: "killed" })
    );
    expect(onClosureSaved).toHaveBeenCalledTimes(1);
    expect(result.current.closure).toBeNull();
  });
});
