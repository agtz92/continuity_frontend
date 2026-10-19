import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

let settings: { theme: string; palette: string } = { theme: "light", palette: "ocre" };

vi.mock("@apollo/client", async (orig) => ({
  ...(await orig<typeof import("@apollo/client")>()),
  useQuery: () => ({ data: { notificationSettings: settings } }),
}));

import { useThemeSync } from "./useThemeSync";
import { usePaletteSync } from "./usePaletteSync";

describe("sync de tema y paleta en vivo", () => {
  beforeEach(() => {
    document.cookie = "NEXT_THEME=; max-age=0; path=/";
    document.cookie = "NEXT_PALETTE=; max-age=0; path=/";
    document.documentElement.removeAttribute("data-theme");
    delete document.documentElement.dataset.palette;
    settings = { theme: "light", palette: "ocre" };
  });

  it("repinta cuando el valor guardado cambia después del primer sync", () => {
    const { rerender } = renderHook(() => {
      useThemeSync();
      usePaletteSync();
    });
    expect(document.documentElement.dataset.theme).toBe("light");

    // Otra pestaña o el móvil guardó otro tema; el aviso en vivo refetchea.
    settings = { theme: "carbon", palette: "salvia" };
    rerender();
    expect(document.documentElement.dataset.theme).toBe("carbon");
    expect(document.documentElement.dataset.palette).toBe("salvia");
  });

  it("repinta aunque la cookie compartida ya tenga el valor nuevo", () => {
    renderHook(() => useThemeSync());
    // La pestaña que hizo el cambio ya escribió la cookie (es compartida),
    // pero el DOM de esta pestaña sigue con el tema viejo.
    document.cookie = "NEXT_THEME=carbon; path=/";
    document.documentElement.dataset.theme = "light";
    settings = { ...settings, theme: "carbon" };
    renderHook(() => useThemeSync());
    expect(document.documentElement.dataset.theme).toBe("carbon");
  });
});
