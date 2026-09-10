import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/** Rampa de reglas de 1px. Los nombres son el alfa: `border-line-10` = 10%. */
const LINE_STEPS = [3, 4, 6, 7, 8, 10, 14, 16, 18, 22, 28, 30, 34];
const ACCENT_ALPHAS = [12, 14, 22, 35, 50, 55];
const SIGNAL_ALPHAS = [2, 3, 4, 9, 10, 12, 16, 50, 55];

const pad = (n: number) => String(n).padStart(2, "0");
/** `line-10`, `accent-a22`… Las claves van planas (no anidadas) porque Tailwind
 *  une los niveles con "-" y `{ a: { 22 } }` produciría `accent-a-22`. */
const ramp = (prefix: string, steps: number[], key = "") =>
  Object.fromEntries(steps.map((n) => [`${key}${pad(n)}`, `var(--${prefix}-${pad(n)})`]));

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  // El producto ya no usa `dark:`: estado, prioridad, categoría y urgencia se
  // resuelven con --signal / --closed / --accent / --line-*, que son sensibles
  // al tema por definición. Queda UN uso legítimo — `dark:prose-invert` en el
  // editor del admin, que sí tiene variante clara y oscura — así que la
  // variante se mantiene pero **acotada al ámbito de admin**: en el tool,
  // escribir `dark:` ya no hace nada, que es justo lo que se quiere.
  darkMode: [
    "selector",
    '[data-theme="dark"] [data-admin="true"], [data-theme="carbon"] [data-admin="true"], [data-theme="continuuit"] [data-admin="true"], [data-theme="continuu"] [data-admin="true"]',
  ],
  // `hover:` variants only apply on devices that actually support hover
  // (i.e. a mouse). iOS Safari/Chrome have a long-standing bug where the
  // :hover state sticks on the last tapped element until another tap or
  // scroll — gating hover styles by `@media (hover: hover)` eliminates the
  // "green flash on the next item" artifact when a list reflows after tap.
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // Superficies. `canvas` queda fuera de la pantalla, `well` son las
        // columnas laterales hundidas.
        canvas: "var(--canvas)",
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        well: "var(--well)",
        // Velo de modales y hojas. Es un token propio y no `bg/NN` a propósito:
        // la opacidad con `/` no se aplica sobre los colores del tema (los
        // tokens guardan hex dentro de var()), así que un `bg-canvas/70` se
        // renderiza como si la clase no existiera. Ver frontend/CLAUDE.md.
        scrim: "var(--scrim)",

        // Tinta. Los cinco grises informativos pasan AA sobre cualquier
        // superficie del tema; `off` queda reservado a controles
        // deshabilitados, el único caso donde WCAG exime el contraste.
        text: {
          DEFAULT: "var(--text)",
          2: "var(--text-2)",
          3: "var(--text-3)",
          4: "var(--text-4)",
          5: "var(--text-5)",
          6: "var(--text-6)",
          off: "var(--text-off)",
          // Alias de compatibilidad — muere en la ola 8.
          muted: "var(--text-muted)",
        },

        // Reglas de 1px. `border-border` es el alias viejo de `line-10`.
        line: ramp("line", LINE_STEPS),
        border: "var(--border)",

        // Acento (lo pisa la paleta) con sus estados.
        accent: {
          DEFAULT: "var(--accent)",
          hi: "var(--accent-hi)",
          lo: "var(--accent-lo)",
          ...ramp("accent-a", ACCENT_ALPHAS, "a"),
          // Alias de compatibilidad — muere en la ola 8.
          2: "var(--accent-2)",
        },

        // Semántica. NO son personalizables por paleta: bloqueado y cerrado
        // son significado, no gusto.
        signal: {
          DEFAULT: "var(--signal)",
          ...ramp("signal-a", SIGNAL_ALPHAS, "a"),
        },
        closed: "var(--closed)",

        toast: {
          bg: "var(--toast-bg)",
          text: "var(--toast-text)",
        },

        // Loop Society brand palette — only resolved when inside a
        // [data-surface="marketing"] wrapper. Use `bg-ls-navy text-ls-cream`
        // in marketing components.
        ls: {
          navy: "var(--ls-navy)",
          cream: "var(--ls-cream)",
          indigo: "var(--ls-indigo)",
          terracotta: "var(--ls-terracotta)",
          forest: "var(--ls-forest)",
          vermillion: "var(--ls-vermillion)",
          ochre: "var(--ls-ochre)",
          "text-primary": "var(--ls-text-primary)",
          "text-secondary": "var(--ls-text-secondary)",
          "text-on-cream": "var(--ls-text-on-cream)",
          "text-on-cream-muted": "var(--ls-text-on-cream-muted)",
        },
      },
      fontFamily: {
        // `display` sigue siendo Fraunces: es la voz del sitio de marketing,
        // que queda fuera del rediseño. El titular del producto usa
        // `font-display-app` (Instrument Sans). Ver REDISENO_PLAN.md §8, DP-07.
        display: ["var(--font-display)", "Fraunces", "Georgia", "serif"],
        "display-app": ["var(--font-display-app)", "Instrument Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-ui)", "Schibsted Grotesk", "system-ui", "sans-serif"],
        // La familia mono desaparece del sistema: los metadatos van en
        // versalitas (.meta / .meta-flat). Se conserva para los bloques de
        // código reales de admin y report-bug.
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        // Única sombra permitida: dura y desplazada, nunca difusa.
        hard: "4px 4px 0 0 var(--shadow)",
        "hard-lg": "8px 8px 0 0 var(--shadow)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [typography],
};

export default config;
