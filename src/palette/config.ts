/**
 * Paletas de acento. Cinco curadas, no once: solo pisan `--accent`,
 * `--accent-hi` y `--accent-lo`. `--signal` (bloqueado, vencido) y `--closed`
 * (completado) NO son personalizables — son semántica, no gusto.
 *
 * Las trece paletas viejas siguen siendo entrada válida durante >=2 releases y
 * el CSS generado las pinta con su equivalente curada, así que un usuario sin
 * migrar ve colores coherentes en vez de caer al default. Se aceptan al LEER
 * (`normalizePalette`) pero nunca se ESCRIBEN (`isPalette`).
 *
 * Los hex viven en `src/design/tokens.json` y los emite `pnpm tokens`; aquí
 * solo están los nombres y los swatches del selector.
 */
export const SUPPORTED_PALETTES = [
  "ocre",
  "salvia",
  "oxido",
  "hielo",
  "ciruela",
] as const;
export type Palette = (typeof SUPPORTED_PALETTES)[number];
export const DEFAULT_PALETTE: Palette = "ocre";

export const PALETTE_COOKIE = "NEXT_PALETTE";

/** Paletas retiradas → su equivalente curada. Se eliminan en la ola 8. */
export const LEGACY_PALETTE_MAP: Readonly<Record<string, Palette>> = {
  default: "ocre",
  continuuit: "ocre",
  green: "salvia",
  turquoise: "salvia",
  pink: "ciruela",
  cute: "ciruela",
  complimentary: "ciruela",
  business: "hielo",
  midnight: "hielo",
  retro: "hielo",
  neon: "oxido",
  sunset: "oxido",
  boho: "oxido",
};

/** ¿Es un nombre canónico? Úsalo en el camino de ESCRITURA. */
export function isPalette(value: unknown): value is Palette {
  return typeof value === "string" && (SUPPORTED_PALETTES as readonly string[]).includes(value);
}

/** Camino de LECTURA: acepta canónicas y retiradas, devuelve siempre canónica. */
export function normalizePalette(value: unknown): Palette | null {
  if (isPalette(value)) return value;
  if (typeof value === "string" && value in LEGACY_PALETTE_MAP) return LEGACY_PALETTE_MAP[value];
  return null;
}

export const PALETTE_LABEL_KEY: Record<Palette, string> = {
  ocre: "paletteOcre",
  salvia: "paletteSalvia",
  oxido: "paletteOxido",
  hielo: "paletteHielo",
  ciruela: "paletteCiruela",
};

/**
 * `data-theme` del documento → la variante de swatch que aplica.
 * Solo hay dos: el acento se oscurece en `light` y se conserva claro en los dos
 * temas oscuros. Acepta los nombres retirados, así que sirve antes y después de
 * la migración. Sin atributo (o con `system`) lee la preferencia del sistema.
 */
export function effectiveSwatchMode(dataTheme?: string | null): "dark" | "light" {
  if (dataTheme === "light") return "light";
  if (dataTheme && dataTheme !== "system") return "dark";
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Pares de acento (base, hover) para los swatches del selector. Espejo de
 * `src/design/tokens.json`: si cambias un hex allí, cámbialo aquí.
 * En `light` el acento se oscurece para pasar AA sobre fondo claro; es una
 * lista aparte, no un filtro sobre la oscura.
 */
export const PALETTE_SWATCHES: Record<
  Palette,
  { dark: [string, string]; light: [string, string] }
> = {
  ocre: {
    dark: ["#D4A847", "#E5BC5E"],
    light: ["#8A6410", "#A97C1D"],
  },
  salvia: {
    dark: ["#8FB98A", "#A8CEA3"],
    light: ["#3F6B45", "#527F58"],
  },
  oxido: {
    dark: ["#E08A5A", "#F0A375"],
    light: ["#9A4A16", "#B45E27"],
  },
  hielo: {
    dark: ["#8FB4D9", "#A9C9EA"],
    light: ["#1F4E79", "#2E6494"],
  },
  ciruela: {
    dark: ["#C08AC0", "#D3A4D3"],
    light: ["#6B2E6B", "#843E84"],
  },
};
