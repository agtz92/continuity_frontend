import type { NoteSection, QuickNote } from "@/lib/types";

/**
 * Búsqueda en notas que **devuelve la sección, no la nota**.
 *
 * La diferencia importa: hoy buscar "presupuesto" te deja una nota de doce
 * secciones abierta y el trabajo de encontrar dónde estaba la palabra sigue
 * siendo tuyo. Aquí el resultado es el trozo concreto, con su encabezado y una
 * línea de contexto, y al pulsarlo se salta ahí.
 *
 * El título de la nota **también busca**: una nota sin secciones que coincida
 * por título tiene que aparecer, o buscarla sería imposible.
 */

/** Cuántos caracteres de contexto alrededor de la coincidencia. */
const SNIPPET_PAD = 40;

export interface SectionHit {
  note: QuickNote;
  /** `null` cuando la coincidencia está en el título y la nota no tiene secciones. */
  section: NoteSection | null;
  /** Encabezado de la sección, o el título de la nota si no hay sección. */
  heading: string;
  /** Fragmento del cuerpo alrededor de la coincidencia, con "…" si se recortó. */
  snippet: string;
}

/** Minúsculas y sin acentos: buscar "diseno" tiene que encontrar "diseño". */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Un trozo del cuerpo centrado en la coincidencia. Si la palabra está en el
 * carácter 900, enseñar los primeros 80 caracteres no serviría de nada.
 */
export function snippetAround(body: string, needle: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!needle) return flat.slice(0, SNIPPET_PAD * 2);

  const at = fold(flat).indexOf(fold(needle));
  if (at === -1) return flat.slice(0, SNIPPET_PAD * 2);

  const start = Math.max(0, at - SNIPPET_PAD);
  const end = Math.min(flat.length, at + needle.length + SNIPPET_PAD);
  return (
    (start > 0 ? "…" : "") + flat.slice(start, end) + (end < flat.length ? "…" : "")
  );
}

/**
 * Todas las secciones que casan, en el orden en que están escritas. Una nota
 * puede aportar varios resultados: si la palabra sale en tres secciones, salen
 * las tres — agruparlas en un solo resultado devolvería el problema original.
 */
export function searchSections(
  notes: QuickNote[],
  query: string
): SectionHit[] {
  const needle = fold(query.trim());
  if (!needle) return [];

  const hits: SectionHit[] = [];
  for (const note of notes) {
    const sections = [...note.sections].sort((a, b) => a.position - b.position);
    let matchedInSections = false;

    for (const section of sections) {
      const inHeading = fold(section.heading).includes(needle);
      const inBody = fold(section.body).includes(needle);
      if (!inHeading && !inBody) continue;
      matchedInSections = true;
      hits.push({
        note,
        section,
        heading: section.heading.trim(),
        snippet: snippetAround(section.body, query.trim()),
      });
    }

    // El título solo aporta resultado propio si ninguna sección casó: si no,
    // el mismo hallazgo saldría dos veces.
    if (!matchedInSections && fold(note.title).includes(needle)) {
      const first = sections[0] ?? null;
      hits.push({
        note,
        section: first,
        heading: first?.heading.trim() ?? "",
        snippet: first ? snippetAround(first.body, "") : "",
      });
    }
  }
  return hits;
}

/** Las notas con al menos un resultado, para el conteo del encabezado. */
export function notesInHits(hits: SectionHit[]): number {
  return new Set(hits.map((h) => h.note.id)).size;
}
