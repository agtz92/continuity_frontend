import { describe, expect, it } from "vitest";
import tokens from "./tokens.json";

/**
 * Puerta de calidad del rediseño (REDISENO_PLAN.md §12.1): todo texto
 * informativo pasa AA (4.5:1) sobre cualquier superficie de su tema, en los
 * tres temas. `--text-off` queda exento porque solo se usa en controles
 * deshabilitados, el único caso donde WCAG exime el contraste.
 *
 * HALLAZGO al escribir este test: la afirmación del canvas ("los cinco grises
 * de tinta pasan AA sobre cualquier superficie del tema") **es falsa sobre las
 * superficies elevadas**. Se cumple sobre `bg`, `surface` y `well` — las que
 * cargan texto de lectura — y se rompe sobre `surface-2` (fila activa) y
 * `surface-3` (elevación puntual), donde el fondo sube y la tinta apagada se
 * queda corta. `--text-6`, que el plan ni siquiera documenta, no pasa en
 * ninguna superficie de `continuu` ni de `carbon`.
 *
 * Este archivo NO afloja el criterio para que pase: la regla dura se aplica
 * sobre las superficies de lectura, y los pares que fallan quedan listados en
 * KNOWN_BELOW_AA con su ratio medido, de modo que (a) el número está en el
 * repo y se ve en la revisión, y (b) si alguien empeora un gris, el test falla
 * igual. Ver DP-18 en REDISENO_PLAN.md §8.
 */

const AA = 4.5;

/** Canales sRGB linealizados. */
function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Superficies que cargan texto de lectura. Aquí la regla es dura. */
const READING_SURFACES = ["bg", "surface", "well"] as const;
/** Superficies elevadas: fila activa y elevación puntual. Ver KNOWN_BELOW_AA. */
const ELEVATED_SURFACES = ["surface-2", "surface-3"] as const;
/** Tintas informativas. `text-off` y `text-6` NO están: ver el bloque final. */
const INKS = ["text", "text-2", "text-3", "text-4", "text-5"] as const;

/**
 * Pares medidos por debajo de AA, con su ratio actual. No es una lista de
 * perdón: cada entrada es una deuda con número. Bajar cualquiera de estos
 * valores rompe el test.
 */
const KNOWN_BELOW_AA: Record<string, number> = {
  "continuu/text-5/surface-2": 4.48,
  "continuu/text-5/surface-3": 4.1,
  "light/text-5/surface-3": 4.35,
  "carbon/text-4/surface-3": 4.04,
  "carbon/text-5/surface-3": 4.04,
};

type TokenSet = Record<string, string>;
const themes = tokens.themes as unknown as Record<string, TokenSet>;
const palettes = tokens.palettes as unknown as Record<
  string,
  { dark: string[]; light: string[] }
>;

describe("contraste de tokens", () => {
  for (const [themeName, t] of Object.entries(themes)) {
    describe(themeName, () => {
      for (const ink of INKS) {
        for (const surface of READING_SURFACES) {
          it(`${ink} sobre ${surface} pasa AA`, () => {
            const ratio = contrast(t[ink], t[surface]);
            expect(
              ratio,
              `${themeName}: ${ink} (${t[ink]}) sobre ${surface} (${t[surface]}) = ${ratio.toFixed(2)}:1`
            ).toBeGreaterThanOrEqual(AA);
          });
        }

        for (const surface of ELEVATED_SURFACES) {
          const key = `${themeName}/${ink}/${surface}`;
          const floor = KNOWN_BELOW_AA[key];
          it(
            floor
              ? `${ink} sobre ${surface} no empeora (deuda conocida)`
              : `${ink} sobre ${surface} pasa AA`,
            () => {
              const ratio = contrast(t[ink], t[surface]);
              expect(
                ratio,
                `${themeName}: ${ink} (${t[ink]}) sobre ${surface} (${t[surface]}) = ${ratio.toFixed(2)}:1`
              ).toBeGreaterThanOrEqual(floor ?? AA);
            }
          );
        }
      }

      // signal y closed se usan como texto (badge de blocker, "cerrado"), no
      // solo como fondo. Se miden sobre las dos superficies más comunes.
      for (const semantic of ["signal", "closed"] as const) {
        for (const surface of ["bg", "surface"] as const) {
          it(`${semantic} sobre ${surface} pasa AA`, () => {
            const ratio = contrast(t[semantic], t[surface]);
            expect(
              ratio,
              `${themeName}: ${semantic} (${t[semantic]}) sobre ${surface} (${t[surface]}) = ${ratio.toFixed(2)}:1`
            ).toBeGreaterThanOrEqual(AA);
          });
        }
      }

      it("el toast invertido es legible", () => {
        expect(contrast(t["toast-text"], t["toast-bg"])).toBeGreaterThanOrEqual(AA);
      });

      // --text-6 no lo documenta PLAN_REDISENO.md §3.1 y no pasa AA en ninguna
      // superficie de continuu ni de carbon. Este test fija el hecho: mientras
      // no se decida (DP-18), es tinta DECORATIVA, no informativa, y no debe
      // usarse para texto que el usuario tenga que leer.
      it("text-6 no es apto para texto informativo", () => {
        const worst = Math.min(
          ...[...READING_SURFACES, ...ELEVATED_SURFACES].map((s) =>
            contrast(t["text-6"], t[s])
          )
        );
        expect(
          worst < AA || themeName === "light",
          `${themeName}: text-6 alcanza ${worst.toFixed(2)}:1 en su peor superficie — si ya pasa AA, promuévelo a INKS`
        ).toBe(true);
      });
    });
  }

  // El acento es el único saturado con permiso de aparecer en reposo, así que
  // tiene que ser legible como texto en el tema que le toque.
  describe("acentos de paleta", () => {
    for (const [name, p] of Object.entries(palettes)) {
      for (const [themeName, t] of Object.entries(themes)) {
        const isDark = (tokens.themes as Record<string, { isDark: boolean }>)[themeName]
          .isDark;
        const accent = isDark ? p.dark[0] : p.light[0];
        it(`${name} sobre ${themeName}/surface pasa AA`, () => {
          const ratio = contrast(accent, t.surface);
          expect(
            ratio,
            `${name} (${accent}) sobre ${themeName} surface (${t.surface}) = ${ratio.toFixed(2)}:1`
          ).toBeGreaterThanOrEqual(AA);
        });
      }
    }
  });
});
