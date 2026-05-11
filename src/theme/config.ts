export const SUPPORTED_THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof SUPPORTED_THEMES)[number];
export const DEFAULT_THEME: Theme = "system";

export const THEME_COOKIE = "NEXT_THEME";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (SUPPORTED_THEMES as readonly string[]).includes(value);
}

export const THEME_LABEL_KEY: Record<Theme, string> = {
  light: "themeLight",
  dark: "themeDark",
  system: "themeSystem",
};
