/**
 * Temas del producto. Tres personalidades con nombre propio; `carbon` no es
 * `continuu` invertido.
 *
 * Los valores viejos (`continuuit`, `dark`) siguen siendo entrada válida
 * durante >=2 releases: llegan de cookies sin migrar, de perfiles de Supabase
 * sin migrar y de la app nativa, que queda fuera de este rediseño. Se aceptan
 * al LEER (`normalizeTheme`) pero nunca se ESCRIBEN (`isTheme`).
 *
 * El tema claro conserva su id `light`: el canvas lo etiqueta "Papel" pero no
 * lo renombra, así que aquí no hay migración que hacer.
 */
export const SUPPORTED_THEMES = ["continuu", "light", "carbon", "system"] as const;
export type Theme = (typeof SUPPORTED_THEMES)[number];
export const DEFAULT_THEME: Theme = "continuu";

export const THEME_COOKIE = "NEXT_THEME";

/** Nombres retirados → su equivalente actual. Se eliminan en la ola 8. */
export const LEGACY_THEME_MAP: Readonly<Record<string, Theme>> = {
  continuuit: "continuu",
  dark: "carbon",
};

/** ¿Es un nombre canónico? Úsalo en el camino de ESCRITURA (cookie, mutación). */
export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (SUPPORTED_THEMES as readonly string[]).includes(value);
}

/**
 * Camino de LECTURA: acepta canónicos y retirados, devuelve siempre canónico.
 * `null` si el valor no se reconoce, para que quien llame decida el fallback.
 */
export function normalizeTheme(value: unknown): Theme | null {
  if (isTheme(value)) return value;
  if (typeof value === "string" && value in LEGACY_THEME_MAP) return LEGACY_THEME_MAP[value];
  return null;
}

export const THEME_LABEL_KEY: Record<Theme, string> = {
  continuu: "themeContinuu",
  light: "themeLight",
  carbon: "themeCarbon",
  system: "themeSystem",
};
