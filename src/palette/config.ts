export const SUPPORTED_PALETTES = [
  "default",
  "pink",
  "business",
  "neon",
  "green",
  "turquoise",
  "cute",
  "midnight",
  "boho",
  "complimentary",
  "sunset",
  "retro",
] as const;
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
  green: "paletteGreen",
  turquoise: "paletteTurquoise",
  cute: "paletteCute",
  midnight: "paletteMidnight",
  boho: "paletteBoho",
  complimentary: "paletteComplimentary",
  sunset: "paletteSunset",
  retro: "paletteRetro",
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
  green: {
    dark: ["#6FCF97", "#2FA084"],
    light: ["#0F8A5C", "#155F4A"],
  },
  turquoise: {
    dark: ["#5DF8D8", "#6FD1D7"],
    light: ["#0D9488", "#0E7490"],
  },
  cute: {
    dark: ["#FFF0BE", "#FFD6A6"],
    light: ["#9B7C20", "#A6582B"],
  },
  midnight: {
    dark: ["#A5B4FC", "#818CF8"],
    light: ["#080616", "#1A1953"],
  },
  boho: {
    dark: ["#CAAA98", "#9A8678"],
    light: ["#7A5D4A", "#5C4434"],
  },
  complimentary: {
    dark: ["#F0E9B6", "#B891C2"],
    light: ["#9B7A1F", "#744577"],
  },
  sunset: {
    dark: ["#EA5252", "#FF9D23"],
    light: ["#B83232", "#B86317"],
  },
  retro: {
    dark: ["#FF9B51", "#7A9CB3"],
    light: ["#C46817", "#25343F"],
  },
};
