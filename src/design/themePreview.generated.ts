/* GENERADO por scripts/generate-tokens.mjs desde src/design/tokens.json.
   NO EDITAR A MANO — los cambios se pierden en el siguiente `pnpm tokens`. */

/** Los cuatro colores que hacen reconocible un tema en un preview de 40×28. */
export interface ThemePreview {
  bg: string;
  surface: string;
  line: string;
  text: string;
  isDark: boolean;
}

export const THEME_PREVIEW: Record<string, ThemePreview> = {
  "continuu": {
    "bg": "#0C0F26",
    "surface": "#101430",
    "line": "rgba(245,241,232, 0.34)",
    "text": "#F5F1E8",
    "isDark": true
  },
  "light": {
    "bg": "#F7F5EF",
    "surface": "#FFFDF8",
    "line": "rgba(92,78,46, 0.34)",
    "text": "#14172B",
    "isDark": false
  },
  "carbon": {
    "bg": "#131210",
    "surface": "#1A1815",
    "line": "rgba(241,237,227, 0.34)",
    "text": "#F1EDE3",
    "isDark": true
  }
};
