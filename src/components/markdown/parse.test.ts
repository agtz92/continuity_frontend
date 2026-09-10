/**
 * El parser de tablas y la detección de bloque incompleto.
 *
 * Los dos fallos que hay que evitar son visuales y silenciosos: una tabla que
 * no se reconoce se imprime como una escalera de tuberías (el bug que motivó
 * todo esto), y una tabla que se reconoce demasiado pronto parpadea columna a
 * columna mientras llega el stream.
 */

import { describe, it, expect } from "vitest";

import {
  emptyColumns,
  parseMarkdown,
  visibleColumnCount,
  type TableBlock,
} from "./parse";

/** La respuesta real que aparece en el canvas del plan. */
const REAL = `Las reprogramé desde mañana hasta el 24 de septiembre.

| Fecha | Tareas | Esfuerzo |
|-------|--------|----------|
| **11/09** | 4 tareas | ~5.5h |
| **12/09** | 2 tareas | ~4.5h |
| Total | 32 | 44 h |`;

function firstTable(md: string): TableBlock {
  const t = parseMarkdown(md).find((b) => b.kind === "table");
  if (!t || t.kind !== "table") throw new Error("no hay tabla");
  return t;
}

describe("parseMarkdown · tablas", () => {
  it("reconoce una tabla GFM y separa cabecera de cuerpo", () => {
    const t = firstTable(REAL);
    expect(t.header).toEqual(["Fecha", "Tareas", "Esfuerzo"]);
    expect(t.rows).toHaveLength(3);
    expect(t.rows[0]).toEqual(["**11/09**", "4 tareas", "~5.5h"]);
  });

  it("el párrafo anterior sigue siendo párrafo", () => {
    const blocks = parseMarkdown(REAL);
    expect(blocks[0].kind).toBe("paragraph");
  });

  it("sin fila separadora NO es tabla: son párrafos", () => {
    const blocks = parseMarkdown("| a | b |\n| c | d |");
    expect(blocks.every((b) => b.kind === "paragraph")).toBe(true);
  });

  it("lee la alineación de la fila separadora", () => {
    const t = firstTable("| a | b | c |\n|:--|:-:|--:|\n| 1 | 2 | 3 |");
    expect(t.align).toEqual(["left", "center", "right"]);
  });

  it("una fila con menos celdas se rellena, con más se recorta", () => {
    const t = firstTable("| a | b | c |\n|---|---|---|\n| 1 |\n| 1 | 2 | 3 | 4 |");
    expect(t.rows[0]).toEqual(["1", "", ""]);
    expect(t.rows[1]).toEqual(["1", "2", "3"]);
  });

  it("detecta la fila de total", () => {
    expect(firstTable(REAL).hasTotalRow).toBe(true);
  });

  it("no confunde una fila normal con un total", () => {
    const t = firstTable("| a | b |\n|---|---|\n| lunes | 3 |");
    expect(t.hasTotalRow).toBe(false);
  });

  it("tolera tablas sin los bordes exteriores", () => {
    const t = firstTable("a | b\n---|---\n1 | 2");
    expect(t.header).toEqual(["a", "b"]);
  });

  it("dos tablas seguidas son dos bloques", () => {
    const md = "| a |\n|---|\n| 1 |\n\n| b |\n|---|\n| 2 |";
    expect(parseMarkdown(md).filter((b) => b.kind === "table")).toHaveLength(2);
  });
});

describe("columnas vacías", () => {
  it("una columna sin cabecera y sin datos se colapsa", () => {
    const t = firstTable("| a |  | c |\n|---|---|---|\n| 1 |  | 3 |");
    expect(emptyColumns(t)).toEqual(new Set([1]));
    expect(visibleColumnCount(t)).toBe(2);
  });

  it("una columna con cabecera pero sin datos NO se colapsa", () => {
    // La cabecera ya informa: decir "Esfuerzo" y no tener datos es un dato.
    const t = firstTable("| a | Esfuerzo |\n|---|---|\n| 1 |  |");
    expect(emptyColumns(t).size).toBe(0);
  });

  it("las columnas vacías no cuentan para el umbral de 4", () => {
    // Seis columnas de las que dos están vacías siguen siendo tabla real.
    const t = firstTable(
      "| a | b |  | c | d |  |\n|---|---|---|---|---|---|\n| 1 | 2 |  | 3 | 4 |  |"
    );
    expect(t.header).toHaveLength(6);
    expect(visibleColumnCount(t)).toBe(4);
  });
});

describe("bloque incompleto durante el stream", () => {
  it("una tabla que aún no cerró se marca incompleta", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |";
    const blocks = parseMarkdown(md, { streaming: true });
    expect(blocks[blocks.length - 1].kind).toBe("incomplete");
  });

  it("la misma tabla, con el stream cerrado, es una tabla", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |";
    expect(parseMarkdown(md).some((b) => b.kind === "table")).toBe(true);
  });

  it("si ya hay contenido DESPUÉS de la tabla, la tabla cerró", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |\n\nY luego texto.";
    const blocks = parseMarkdown(md, { streaming: true });
    expect(blocks.some((b) => b.kind === "table")).toBe(true);
    expect(blocks.some((b) => b.kind === "incomplete")).toBe(false);
  });

  it("el texto normal en streaming no se marca incompleto", () => {
    const blocks = parseMarkdown("Estoy escribiendo", { streaming: true });
    expect(blocks[0].kind).toBe("paragraph");
  });
});
