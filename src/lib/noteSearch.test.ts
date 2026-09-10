/**
 * La búsqueda de notas devuelve **secciones**, no notas. Los dos fallos que hay
 * que evitar son silenciosos: duplicar un hallazgo (sale dos veces lo mismo) y
 * perderlo (una nota que casa por título no aparece).
 */

import { describe, it, expect } from "vitest";

import type { NoteSection, QuickNote } from "@/lib/types";
import { searchSections, snippetAround, notesInHits } from "./noteSearch";

function section(overrides: Partial<NoteSection> = {}): NoteSection {
  return {
    id: "s1",
    noteId: "n1",
    heading: "Presupuesto",
    body: "El presupuesto aprobado son 40k",
    position: 0,
    collapsed: false,
    created: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function note(overrides: Partial<QuickNote> = {}): QuickNote {
  return {
    id: "n1",
    title: "Reunión con el cliente",
    categoryId: null,
    projectId: null,
    pinned: false,
    sections: [section()],
    created: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("searchSections", () => {
  it("devuelve la sección, no la nota", () => {
    const hits = searchSections([note()], "aprobado");
    expect(hits).toHaveLength(1);
    expect(hits[0].section?.id).toBe("s1");
    expect(hits[0].heading).toBe("Presupuesto");
  });

  it("una nota puede aportar varios resultados, uno por sección", () => {
    const n = note({
      sections: [
        section({ id: "a", position: 0, body: "hablar del plan" }),
        section({ id: "b", position: 1, heading: "Otro", body: "también el plan" }),
      ],
    });
    const hits = searchSections([n], "plan");
    expect(hits.map((h) => h.section?.id)).toEqual(["a", "b"]);
    expect(notesInHits(hits)).toBe(1);
  });

  it("respeta el orden de las secciones, no el del array", () => {
    const n = note({
      sections: [
        section({ id: "segunda", position: 2, body: "plan B" }),
        section({ id: "primera", position: 1, body: "plan A" }),
      ],
    });
    expect(searchSections([n], "plan").map((h) => h.section?.id)).toEqual([
      "primera",
      "segunda",
    ]);
  });

  it("ignora acentos y mayúsculas", () => {
    const n = note({ sections: [section({ body: "el diseño final" })] });
    expect(searchSections([n], "DISENO")).toHaveLength(1);
  });

  it("casa también por encabezado", () => {
    const n = note({ sections: [section({ heading: "Riesgos", body: "nada" })] });
    expect(searchSections([n], "riesgos")).toHaveLength(1);
  });

  it("una nota que casa SOLO por título aparece igual", () => {
    const n = note({
      title: "Contrato Kimix",
      sections: [section({ heading: "x", body: "nada que ver" })],
    });
    const hits = searchSections([n], "kimix");
    expect(hits).toHaveLength(1);
    expect(hits[0].note.id).toBe("n1");
  });

  it("una nota sin secciones que casa por título no se pierde", () => {
    const n = note({ title: "Ideas sueltas", sections: [] });
    const hits = searchSections([n], "sueltas");
    expect(hits).toHaveLength(1);
    expect(hits[0].section).toBeNull();
  });

  it("el título NO duplica el hallazgo si ya casó una sección", () => {
    const n = note({
      title: "Presupuesto anual",
      sections: [section({ heading: "Presupuesto", body: "40k" })],
    });
    expect(searchSections([n], "presupuesto")).toHaveLength(1);
  });

  it("sin consulta no devuelve nada", () => {
    expect(searchSections([note()], "   ")).toEqual([]);
  });
});

describe("snippetAround", () => {
  it("centra el fragmento en la coincidencia, no en el principio", () => {
    const body = "a".repeat(200) + " AGUJA " + "b".repeat(200);
    const s = snippetAround(body, "AGUJA");
    expect(s).toContain("AGUJA");
    expect(s.startsWith("…")).toBe(true);
    expect(s.endsWith("…")).toBe(true);
  });

  it("aplasta los saltos de línea: es una línea de contexto", () => {
    expect(snippetAround("uno\n\n  dos", "dos")).toBe("uno dos");
  });

  it("sin coincidencia devuelve el principio, no vacío", () => {
    expect(snippetAround("hola mundo", "zzz")).toBe("hola mundo");
  });
});
