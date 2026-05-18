import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
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
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          2: "var(--accent-2)",
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
        display: ["var(--font-display)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [typography],
};

export default config;
