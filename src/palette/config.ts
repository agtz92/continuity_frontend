export const SUPPORTED_PALETTES = ["default", "pink", "business", "neon"] as const;
export type Palette = (typeof SUPPORTED_PALETTES)[number];
export const DEFAULT_PALETTE: Palette = "default";

export const PALETTE_COOKIE = "NEXT_PALETTE";

export function isPalette(value: unknown): value is Palette {
  return (
    typeof value === "string" &&
    (SUPPORTED_PALETTES as readonly string[]).includes(value)
  );
}

export const PALETTE_LABEL_KEY: Record<Palette, string> = {
  default: "paletteDefault",
  pink: "palettePink",
  business: "paletteBusiness",
  neon: "paletteNeon",
};

/**
 * Hex pairs (accent, accent-2) shown as small swatches next to each option.
 * Kept in sync with the CSS overrides in globals.css. The first pair is for
 * dark theme, the second for light. The selector picks the right pair based
 * on the active theme so the swatch always previews what you'll actually see.
 */
export const PALETTE_SWATCHES: Record<
  Palette,
  { dark: [string, string]; light: [string, string] }
> = {
  default: {
    dark: ["#34d399", "#60a5fa"],
    light: ["#4f46e5", "#d97706"],
  },
  pink: {
    dark: ["#f472b6", "#e879f9"],
    light: ["#db2777", "#c026d3"],
  },
  business: {
    dark: ["#93c5fd", "#94a3b8"],
    light: ["#1d4ed8", "#475569"],
  },
  neon: {
    dark: ["#a3e635", "#22d3ee"],
    light: ["#65a30d", "#0891b2"],
  },
};
