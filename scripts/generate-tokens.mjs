#!/usr/bin/env node
/**
 * Generador de la capa de tokens del rediseño.
 *
 *   pnpm tokens
 *
 * Lee `src/design/tokens.json` (fuente única de verdad) y escribe:
 *
 *   1. `src/app/tokens.generated.css`  — importado por globals.css.
 *   2. `src/design/tokens.rn.generated.ts` — el mismo juego de tokens con los
 *      alfas ya literalizados en rgba(), para NativeWind. React Native no tiene
 *      `color-mix()`, así que las rampas --line-*, --accent-a* y --signal-a* no
 *      pueden viajar como están. Este archivo NO se consume hoy: la app nativa
 *      quedó fuera del alcance (REDISENO_PLAN.md §8, DP-01). Se emite igual para
 *      que la fuente de verdad no haya que reconstruirla cuando entre.
 *
 * Ninguno de los dos archivos generados se edita a mano.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SRC = join(ROOT, "src", "design", "tokens.json");
const OUT_CSS = join(ROOT, "src", "app", "tokens.generated.css");
const OUT_RN = join(ROOT, "src", "design", "tokens.rn.generated.ts");

const T = JSON.parse(readFileSync(SRC, "utf8"));

const BANNER = `/* GENERADO por scripts/generate-tokens.mjs desde src/design/tokens.json.
   NO EDITAR A MANO — los cambios se pierden en el siguiente \`pnpm tokens\`. */`;

/** Tokens de superficie/tinta que todo tema y todo ámbito debe declarar. */
const SURFACE_KEYS = [
  "canvas", "bg", "surface", "surface-2", "surface-3", "well", "scrim",
  "text", "text-2", "text-3", "text-4", "text-5", "text-6", "text-off",
  "signal", "closed", "toast-bg", "toast-text", "shadow",
];

/**
 * Rampas derivadas. Se emiten DENTRO de cada bloque, no solo en :root: las
 * custom properties con `color-mix(… var(--accent) …)` se computan en el
 * elemento donde se declaran, así que un `--accent-a12` declarado solo en
 * :root seguiría apuntando al acento del root dentro de [data-admin], que
 * define el suyo propio.
 */
function ramps() {
  const out = [];
  for (const n of T.ramps.line) {
    out.push(`  --line-${pad(n)}: rgba(var(--line-rgb), ${(n / 100).toFixed(2)});`);
  }
  for (const n of T.ramps.accent) {
    out.push(`  --accent-a${pad(n)}: color-mix(in srgb, var(--accent) ${n}%, transparent);`);
  }
  for (const n of T.ramps.signal) {
    out.push(`  --signal-a${pad(n)}: color-mix(in srgb, var(--signal) ${n}%, transparent);`);
  }
  return out;
}

const pad = (n) => String(n).padStart(2, "0");

/**
 * Alias de compatibilidad. Los ~cientos de usos de `bg-surface`,
 * `text-text-muted` y `border-border` siguen funcionando sin tocarse; mueren en
 * la ola 8. `--accent-2` NO apunta a --signal (de sus 147 usos, cero son
 * semántica de bloqueo — REDISENO_PLAN.md §3.1): conserva un valor propio por
 * tema hasta que la ola 1 migre los ~40 chips de "tiene hora" a metadato neutro.
 */
function aliases(def) {
  return [
    `  --border: ${def.border ?? "var(--line-10)"};`,
    `  --text-muted: ${def["text-muted"] ?? "var(--text-4)"};`,
    `  --accent-2: ${def["accent-2-legacy"]};`,
  ];
}

function surfaceLines(def) {
  return SURFACE_KEYS.map((k) => `  --${k}: ${def[k]};`).concat([
    `  --line-rgb: ${def["line-rgb"]};`,
  ]);
}

function block(selector, lines) {
  return `${selector} {\n${lines.join("\n")}\n}`;
}

// ---------------------------------------------------------------- CSS

const css = [BANNER, ""];

css.push("/* ── Acento por defecto ────────────────────────────────────────────────── */");
css.push(
  "/* Sin este bloque, un documento sin `data-palette` (el instante anterior al",
  "   no-flash script, o cualquier página que no lo aplique) dejaría --accent sin",
  "   valor y con él toda la rampa --accent-a*. */",
  block(":root", [
    `  --accent: ${T.palettes[T.defaultPalette].dark[0]};`,
    `  --accent-hi: ${T.palettes[T.defaultPalette].dark[1]};`,
    `  --accent-lo: ${T.palettes[T.defaultPalette].dark[2]};`,
  ]),
  ""
);

css.push("/* ── Temas ─────────────────────────────────────────────────────────────── */");
css.push(
  "/* Los nombres viejos (`continuuit`, `dark`) siguen siendo selectores válidos:",
  "   una cookie o un perfil sin migrar pinta el tema nuevo equivalente. */",
  ""
);

for (const [name, def] of Object.entries(T.themes)) {
  const selectors = [`[data-theme="${name}"]`, ...def.aliases.map((a) => `[data-theme="${a}"]`)];
  // El tema por defecto también responde a :root, para el primer paint y para
  // los visitantes sin cookie.
  if (name === Object.keys(T.themes)[0]) selectors.unshift(":root");
  css.push(block(selectors.join(",\n"), [...surfaceLines(def), ...ramps(), ...aliases(def)]), "");
}

css.push("/* ── Paletas de acento ─────────────────────────────────────────────────── */");
css.push(
  "/* Solo pisan --accent / --accent-hi / --accent-lo. --signal y --closed no son",
  "   personalizables: son semántica, no gusto. En `light` el acento se oscurece",
  "   para pasar AA sobre fondo claro; es una lista aparte, no un filtro. */",
  ""
);

/** Nombre → [claro, oscuro] resuelto, siguiendo el mapa de paletas retiradas. */
function paletteFor(name) {
  const target = T.palettes[name] ? name : T.legacyPalettes[name];
  return T.palettes[target] ?? null;
}

const lightThemeSelectors = Object.entries(T.themes)
  .filter(([, d]) => !d.isDark)
  .flatMap(([n, d]) => [n, ...d.aliases]);

const allPaletteNames = [
  ...Object.keys(T.palettes),
  ...Object.keys(T.legacyPalettes).filter((k) => k !== "$doc"),
];

for (const name of allPaletteNames) {
  const p = paletteFor(name);
  if (!p) continue;
  const legacyOf = T.palettes[name] ? null : T.legacyPalettes[name];
  if (legacyOf) css.push(`/* retirada → ${legacyOf} */`);
  css.push(
    block(`[data-palette="${name}"]`, [
      `  --accent: ${p.dark[0]};`,
      `  --accent-hi: ${p.dark[1]};`,
      `  --accent-lo: ${p.dark[2]};`,
    ])
  );
  const lightSel = lightThemeSelectors
    .map((t) => `[data-theme="${t}"][data-palette="${name}"]`)
    .join(",\n");
  css.push(
    block(lightSel, [
      `  --accent: ${p.light[0]};`,
      `  --accent-hi: ${p.light[1]};`,
      `  --accent-lo: ${p.light[2]};`,
    ]),
    ""
  );
}

css.push("/* ── Ámbitos aislados ──────────────────────────────────────────────────── */");
css.push(
  "/* Admin y marketing quedan FUERA del rediseño. Redeclaran el juego completo",
  "   de tokens para no heredar los del tool: sin esto, activar `light` pintaría",
  "   texto oscuro sobre el navy de marketing. `border` y `text-muted` van",
  "   literales, no como alias, para que estas zonas no cambien ni un píxel. */",
  ""
);

for (const [key, def] of Object.entries(T.scopes)) {
  if (key === "$doc") continue;
  css.push(
    block(def.selector, [
      ...surfaceLines(def),
      `  --accent: ${def.accent};`,
      `  --accent-hi: ${def["accent-hi"]};`,
      `  --accent-lo: ${def["accent-lo"]};`,
      ...ramps(),
      ...aliases(def),
    ]),
    ""
  );
}

writeFileSync(OUT_CSS, css.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n", "utf8");

// ---------------------------------------------------------------- RN

/** `#rrggbb` → `r,g,b`. */
function rgbOf(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ");
}

function rnRamps(def, accentHex) {
  const o = {};
  for (const n of T.ramps.line) o[`--line-${pad(n)}`] = `rgba(${def["line-rgb"].split(",").map((s) => s.trim()).join(", ")}, ${(n / 100).toFixed(2)})`;
  for (const n of T.ramps.accent) o[`--accent-a${pad(n)}`] = `rgba(${rgbOf(accentHex)}, ${(n / 100).toFixed(2)})`;
  for (const n of T.ramps.signal) o[`--signal-a${pad(n)}`] = `rgba(${rgbOf(def.signal)}, ${(n / 100).toFixed(2)})`;
  return o;
}

const rnThemes = {};
for (const [name, def] of Object.entries(T.themes)) {
  const base = {};
  for (const k of SURFACE_KEYS) base[`--${k}`] = def[k];
  base["--border"] = `rgba(${def["line-rgb"].split(",").map((s) => s.trim()).join(", ")}, 0.10)`;
  base["--text-muted"] = def["text-4"];
  base["--accent-2"] = def["accent-2-legacy"];
  rnThemes[name] = base;
}

const rnPalettes = {};
for (const name of allPaletteNames) {
  const p = paletteFor(name);
  if (!p) continue;
  rnPalettes[name] = { dark: p.dark, light: p.light };
}

// Las rampas dependen del acento activo, así que en RN se calculan en runtime.
// Aquí solo se exporta el helper de datos; el consumidor las compone.
const rnRampSample = Object.fromEntries(
  Object.entries(T.themes).map(([n, d]) => [n, rnRamps(d, T.palettes[T.defaultPalette].dark[0])])
);

const rn = `${BANNER.replace(/\/\*|\*\//g, "").trim().split("\n").map((l) => "// " + l.trim()).join("\n")}
//
// La app nativa quedó fuera del alcance del rediseño (REDISENO_PLAN.md §8, DP-01).
// Este archivo se emite pero NO se importa desde ningún sitio todavía: existe para
// que, cuando móvil entre, la fuente de verdad ya sea la misma y no haya que
// reconstruirla. Copiarlo entonces a continuity-mobile/src/theme/.

export type ThemeName = ${Object.keys(T.themes).map((n) => JSON.stringify(n)).join(" | ")};
export type PaletteName = ${Object.keys(rnPalettes).map((n) => JSON.stringify(n)).join(" | ")};

/** Superficies y tintas por tema, con los alias de compatibilidad resueltos. */
export const THEME_VARS: Record<ThemeName, Record<string, string>> = ${JSON.stringify(rnThemes, null, 2)};

/** [accent, accent-hi, accent-lo] por paleta y luminosidad del tema. */
export const PALETTE_VARS: Record<PaletteName, { dark: string[]; light: string[] }> = ${JSON.stringify(rnPalettes, null, 2)};

/** Rampas alfa con el acento por defecto. RN no tiene color-mix: recalcular con
 *  \`buildRamps\` cuando el usuario cambie de paleta. */
export const RAMPS_DEFAULT: Record<ThemeName, Record<string, string>> = ${JSON.stringify(rnRampSample, null, 2)};
`;

mkdirSync(dirname(OUT_RN), { recursive: true });
writeFileSync(OUT_RN, rn, "utf8");

// ---------------------------------------------------- Preview de temas (S19)
// El selector de apariencia enseña un preview REAL de cada tema. Se emite desde
// aquí para que no pueda divergir: si alguien cambia el papel en tokens.json,
// el cuadradito del selector cambia con él.
const preview = `${BANNER}

/** Los cuatro colores que hacen reconocible un tema en un preview de 40×28. */
export interface ThemePreview {
  bg: string;
  surface: string;
  line: string;
  text: string;
  isDark: boolean;
}

export const THEME_PREVIEW: Record<string, ThemePreview> = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(T.themes).map(([name, def]) => [
      name,
      {
        bg: def.bg,
        surface: def.surface,
        line: `rgba(${def["line-rgb"]}, 0.34)`,
        text: def.text,
        isDark: !!def.isDark,
      },
    ])
  ),
  null,
  2
)};
`;

const OUT_PREVIEW = join(ROOT, "src", "design", "themePreview.generated.ts");
writeFileSync(OUT_PREVIEW, preview, "utf8");

console.log(`tokens → ${OUT_CSS.replace(ROOT, ".")}`);
console.log(`tokens → ${OUT_PREVIEW.replace(ROOT, ".")}`);
console.log(`tokens → ${OUT_RN.replace(ROOT, ".")} (emitido, no consumido)`);
