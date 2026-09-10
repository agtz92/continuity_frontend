/**
 * Guardarraíl de i18n.
 *
 * next-intl **no falla** cuando falta una clave: pinta el path en mayúsculas
 * ("VIEWS.LOG.ENTRY.ROUTINECOMPLETED") y sigue como si nada. Ni el compilador
 * ni el build lo detectan, así que un namespace mal escrito llega a producción
 * y lo descubre el usuario. Ha pasado varias veces durante el rediseño — una de
 * ellas porque un `git checkout -- messages/*.json` se llevó por delante claves
 * que ya estaban en uso, y nada lo dijo.
 *
 * Cuatro puertas, cuatro tests:
 *   1. un idioma con claves que el otro no tiene,
 *   2. un `useTranslations("x.y")` apuntando a un namespace inexistente,
 *   3. un `t("clave")` que no existe bajo su namespace,
 *   4. **texto de interfaz escrito a mano**, que no pasa por i18n en absoluto.
 *
 * El cuarto es el que faltaba y el que más caro sale: los otros tres detectan
 * que una traducción se rompió; este detecta que **nunca existió**. Se han
 * colado así "·· suelta", "7/12 tareas · 58 %", "Buscar…" y "Sin resultados",
 * todos en producción y todos en el idioma equivocado para media base de
 * usuarios.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, it, expect } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";

type Tree = { [k: string]: string | Tree };

const EN = en as unknown as Tree;
const ES = es as unknown as Tree;

/** Todos los paths hoja, "a.b.c". */
function leafPaths(tree: Tree, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...leafPaths(v as Tree, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

/** ¿Existe ese path, sea hoja o rama? */
function hasPath(tree: Tree, path: string): boolean {
  let node: unknown = tree;
  for (const seg of path.split(".")) {
    if (typeof node !== "object" || node === null) return false;
    node = (node as Record<string, unknown>)[seg];
    if (node === undefined) return false;
  }
  return true;
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const FILES = sourceFiles(join(process.cwd(), "src"));
const rel = (f: string) =>
  f.slice(process.cwd().length + 1).replace(/\\/g, "/");

describe("mensajes", () => {
  it("en y es tienen exactamente las mismas claves", () => {
    const a = new Set(leafPaths(EN));
    const b = new Set(leafPaths(ES));
    expect({
      soloEn: [...a].filter((k) => !b.has(k)).sort(),
      soloEs: [...b].filter((k) => !a.has(k)).sort(),
    }).toEqual({ soloEn: [], soloEs: [] });
  });

  it('todo useTranslations("…") apunta a un namespace que existe', () => {
    const missing: string[] = [];
    for (const file of FILES) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/useTranslations\(\s*"([^"]+)"\s*\)/g)) {
        if (!hasPath(EN, m[1])) missing.push(`${rel(file)} → ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('todo t("clave") existe bajo su namespace', () => {
    const missing: string[] = [];

    for (const file of FILES) {
      const src = readFileSync(file, "utf8");

      // Un mismo nombre de variable puede tener varios namespaces en un
      // archivo (dos componentes, dos `const t = useTranslations(...)`), así
      // que basta con que la clave exista bajo alguno.
      const byVar = new Map<string, Set<string>>();
      // Namespaces por plantilla (`landing.pricing.tiers.${id}`) no se pueden
      // resolver estáticamente: ese nombre de variable queda exento.
      const dynamic = new Set<string>();

      for (const m of src.matchAll(
        /const\s+(\w+)\s*=\s*useTranslations\(\s*(["`])([^"`]*)\2\s*\)/g
      )) {
        const [, name, quote, ns] = m;
        if (quote === "`" && ns.includes("${")) {
          dynamic.add(name);
          continue;
        }
        const set = byVar.get(name) ?? new Set<string>();
        set.add(ns);
        byVar.set(name, set);
      }

      for (const [name, namespaces] of byVar) {
        if (dynamic.has(name)) continue;
        const calls = src.matchAll(
          new RegExp(`\\b${name}\\(\\s*"([^"]+)"`, "g")
        );
        for (const call of calls) {
          const key = call[1];
          const ok = [...namespaces].some(
            (ns) => hasPath(EN, `${ns}.${key}`) && hasPath(ES, `${ns}.${key}`)
          );
          if (!ok) {
            missing.push(`${rel(file)} → ${[...namespaces].join("|")}.${key}`);
          }
        }
      }
    }

    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------- hardcode

/**
 * Zonas con sus propias reglas de idioma. **No es una lista de perdón**: son
 * superficies que no pasan por i18n por decisión (marketing tiene su propio
 * sistema de locales por URL; admin es de una sola persona y va en español; la
 * entrada vive en la superficie de marketing, D-63).
 */
const OUT_OF_SCOPE = [
  "src/components/marketing/",
  "src/components/landing/",
  "src/components/resources/",
  "src/components/admin/",
  "src/app/(marketing-en)/",
  "src/app/(marketing-es)/",
  "src/app/(app)/admin/",
  "src/app/(app)/login/",
  "src/app/(app)/reset-password/",
];

/**
 * Excepciones con nombre y motivo. Que esta lista solo pueda encogerse es el
 * punto: añadir una entrada obliga a escribir por qué.
 */
const ALLOWED_HARDCODED = new Map<string, string>([
  [
    "src/app/opengraph-image.tsx",
    "Imagen social estática: es copy de marca y se genera una sola vez, sin locale.",
  ],
]);

/** Atributos que una persona lee o escucha. */
const HUMAN_ATTRS = ["title", "aria-label", "placeholder", "alt"];

/** Firmas de tipo que el barrido de `>…<` recoge sin ser texto. */
const TYPE_ISH =
  /[|(){}[\]=!:;<>]|=>|\b(void|Promise|ReactNode|null|undefined|string|number|boolean|Partial|Record|Set|Map|Array|React|CSSProperties)\b/;

/** Al menos tres letras seguidas: menos que eso es un glifo o un número. */
const HAS_WORD = /[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}/;

/**
 * Fuera comentarios: su texto no llega al usuario. Los saltos de línea del
 * bloque se conservan para que el número de línea no se descuadre.
 */
function withoutComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => (m.match(/\n/g) ?? []).join(""))
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("texto de interfaz", () => {
  it("no hay copy escrito a mano fuera de i18n", () => {
    const offenders: string[] = [];

    for (const file of FILES) {
      if (!file.endsWith(".tsx")) continue;
      const path = rel(file);
      if (OUT_OF_SCOPE.some((zone) => path.startsWith(zone))) continue;
      if (ALLOWED_HARDCODED.has(path)) continue;

      const src = withoutComments(readFileSync(file, "utf8"));

      // Nodos de texto JSX: >texto<
      for (const m of src.matchAll(/>([^<>{}\n]{2,})</g)) {
        const text = m[1].trim();
        if (TYPE_ISH.test(text) || !HAS_WORD.test(text)) continue;
        offenders.push(`${path} → ${text.slice(0, 60)}`);
      }

      // Atributos accesibles con literal
      const attrRe = new RegExp(
        `\\b(${HUMAN_ATTRS.join("|")})\\s*=\\s*"([^"]{3,})"`,
        "g"
      );
      for (const m of src.matchAll(attrRe)) {
        const text = m[2].trim();
        if (!HAS_WORD.test(text)) continue;
        offenders.push(`${path} → ${m[1]}="${text.slice(0, 60)}"`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
