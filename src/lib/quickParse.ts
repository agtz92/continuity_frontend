import type { Project } from "@/lib/types";

/**
 * El parser de la captura rápida (⌘K).
 *
 * La idea del diseño es escribir una línea y que salga bien puesta, sin tocar
 * el ratón: `#` elige proyecto y `!` marca que está bloqueada y por qué.
 *
 *     Llamar a Hacienda #impuestos !esperando el poder notarial
 *     → título "Llamar a Hacienda", proyecto Impuestos, blocker con su razón
 *
 * Reglas, y por qué:
 *
 * - **`!` se lleva todo lo que queda a su derecha.** Una razón de bloqueo es
 *   una frase ("esperando el contrato firmado"), no una palabra. Solo cuenta el
 *   primer `!`; los siguientes son texto.
 * - **`#` es una sola palabra**, porque tiene que terminar en algún sitio para
 *   que el resto siga siendo título.
 * - **Si `#algo` no encuentra proyecto, se queda en el título.** Tragarse un
 *   token que no hizo nada dejaría al usuario sin saber que falló.
 * - Se ignoran acentos y mayúsculas al buscar el proyecto: escribir `#migracion`
 *   tiene que encontrar "Migración".
 */

export interface QuickParsed {
  title: string;
  projectId: string | null;
  /** El proyecto resuelto, para poder enseñarlo mientras se escribe. */
  project: Project | null;
  /** `true` en cuanto aparece un `!`, aunque no lleve razón detrás. */
  blocked: boolean;
  blockerReason: string;
}

/** Minúsculas y sin acentos, para comparar lo que el usuario teclea. */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca proyecto por nombre. Primero exacto, luego por prefijo; entre varios
 * prefijos gana el nombre más corto, que es el más específico de los que
 * empiezan igual ("Web" antes que "Web · rediseño" para `#web`).
 */
export function matchProject(
  token: string,
  projects: Project[]
): Project | null {
  const needle = fold(token);
  if (!needle) return null;

  const exact = projects.find((p) => fold(p.name) === needle);
  if (exact) return exact;

  const prefixed = projects
    .filter((p) => fold(p.name).startsWith(needle))
    .sort((a, b) => a.name.length - b.name.length);
  if (prefixed.length > 0) return prefixed[0];

  const contained = projects
    .filter((p) => fold(p.name).includes(needle))
    .sort((a, b) => a.name.length - b.name.length);
  return contained[0] ?? null;
}

export function quickParse(raw: string, projects: Project[]): QuickParsed {
  // 1. El blocker se corta primero: todo lo que hay tras el primer `!`.
  const bang = raw.indexOf("!");
  const blocked = bang !== -1;
  const blockerReason = blocked ? raw.slice(bang + 1).trim() : "";
  const head = blocked ? raw.slice(0, bang) : raw;

  // 2. El primer `#palabra` que resuelva a un proyecto sale del título.
  let project: Project | null = null;
  const title = head
    .replace(/#(\S+)/g, (whole, token: string) => {
      if (project) return whole; // solo el primero
      const found = matchProject(token, projects);
      if (!found) return whole; // no resolvió: se queda a la vista
      project = found;
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();

  return {
    title,
    projectId: project ? (project as Project).id : null,
    project,
    blocked,
    blockerReason,
  };
}
