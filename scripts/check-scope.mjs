#!/usr/bin/env node
/**
 * Guardarraíl de alcance del rediseño.
 *
 *   pnpm scope
 *
 * Falla si hay cambios sin commitear en las zonas que el rediseño declara
 * intocables (PLAN_REDISENO.md §1): el sitio de marketing, el admin y las
 * pantallas de entrada. Está pensado para correrse **antes de commitear** y
 * después de cualquier barrido masivo.
 *
 * Por qué existe: en la ola 1 un barrido de radios se filtró a 27 archivos de
 * landing, blog y admin. La causa fue que la exclusión iba en una expresión
 * regular con `\\` para separar rutas de Windows, y el `\\` se colapsó a `\` al
 * escribir el script — la clase quedó en `[\/]`, que no incluye el backslash,
 * así que no excluía nada. No falla ni avisa: pasa todo. Ver D-25 en
 * REDISENO_DECISIONES.md.
 *
 * Regla derivada, y la razón de que este archivo no tenga un solo backslash:
 * **las rutas se normalizan a "/" y se comparan con prefijos, no con regex.**
 */

import { execFileSync } from "node:child_process";

/** Zonas fuera del alcance del rediseño. Prefijos, ya normalizados a "/". */
const PROTECTED = [
  "src/components/landing/",
  "src/components/marketing/",
  "src/components/resources/",
  "src/components/admin/",
  "src/app/(marketing-en)/",
  "src/app/(marketing-es)/",
  "src/app/(app)/admin/",
  // Entrada: vive en la superficie de marketing y tiene su propia decisión
  // pendiente en la ola 7 (D-14 / D-23).
  "src/app/(app)/login/",
  "src/app/(app)/reset-password/",
];

/**
 * Excepciones deliberadas: cambios en zona protegida que sí se decidieron.
 * Cada entrada necesita el porqué; si no se puede explicar, no es excepción.
 */
const ALLOWED = new Map([
  [
    "src/components/marketing/CmsPage.tsx",
    "D-18: `dark:prose-invert` pasa a `prose-invert` fijo — la superficie de marketing siempre es oscura.",
  ],
  [
    "src/app/(app)/login/page.tsx",
    "D-63: decidido que la entrada SE QUEDA en la superficie de marketing. Solo cae el `backdrop-blur` y la sombra arbitraria; la identidad de marca no se toca.",
  ],
  [
    "src/app/(app)/reset-password/page.tsx",
    "D-63: mismo caso. El titular deja el degradado `--accent-2` (alias que muere en la ola 8) y pasa a tinta.",
  ],
]);

function changedFiles() {
  const out = execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all", "--", "src"],
    { encoding: "utf8" }
  );
  return out
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    // `git status` ya devuelve "/" incluso en Windows, pero normalizar es
    // barato y es justo el descuido que provocó el incidente.
    .map((p) => p.split("\\").join("/"))
    // Renombrados llegan como "viejo -> nuevo"; interesa el destino.
    .map((p) => (p.includes(" -> ") ? p.split(" -> ")[1] : p))
    .map((p) => p.replace(/^"|"$/g, ""));
}

const offenders = changedFiles().filter(
  (f) => PROTECTED.some((zone) => f.startsWith(zone)) && !ALLOWED.has(f)
);

if (offenders.length === 0) {
  const exceptions = changedFiles().filter((f) => ALLOWED.has(f));
  console.log("scope: OK — ninguna zona protegida tocada.");
  for (const f of exceptions) {
    console.log(`  excepción aceptada: ${f}\n    ${ALLOWED.get(f)}`);
  }
  process.exit(0);
}

console.error("scope: FALLO — hay cambios en zonas fuera del alcance del rediseño:\n");
for (const f of offenders) console.error(`  ${f}`);
console.error(
  [
    "",
    "Estas zonas son no-objetivo del rediseño (PLAN_REDISENO.md §1).",
    "Si el cambio fue accidental (un barrido que se pasó de rosca):",
    "",
    "  git checkout -- <archivo>",
    "",
    "Si es deliberado, añádelo a ALLOWED en este archivo con su porqué.",
  ].join("\n")
);
process.exit(1);
