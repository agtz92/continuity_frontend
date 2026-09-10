"use client";

import { emptyColumns, type TableBlock } from "./parse";
import { Meta } from "@/components/ui/Meta";

/**
 * La misma tabla, como **filas de la app**. Es el plan B, no el A.
 *
 * A partir de cinco columnas visibles una tabla real no cabe en el panel sin
 * romper algo: o hay scroll horizontal (prohibido) o las celdas envuelven a
 * tres líneas. Aquí cada fila del markdown pasa a ser una fila del producto —
 * título a la izquierda, la cifra a la derecha en display, y el resto como
 * metadatos debajo.
 *
 * Lo que se pierde es la comparación columna a columna, y ocupa el doble de
 * alto. Por eso lo elige **el renderer contando columnas**, no el usuario: no
 * es una preferencia, es lo que cabe.
 */
export function MdTableRows({ table }: { table: TableBlock }) {
  const hidden = emptyColumns(table);
  const cols = table.header.map((_, i) => i).filter((i) => !hidden.has(i));
  if (cols.length === 0) return null;

  const titleCol = cols[0];
  // La cifra grande es la última columna alineada a la derecha; si el modelo no
  // alineó nada, la última visible.
  const numericCol =
    [...cols].reverse().find((i) => table.align[i] === "right") ??
    cols[cols.length - 1];
  const metaCols = cols.filter((i) => i !== titleCol && i !== numericCol);

  return (
    <div className="my-3 divide-y divide-line-08 border-y border-line-08">
      {table.rows.map((row, r) => (
        <div key={r} className="flex items-baseline gap-3 py-2.5">
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-semibold text-text truncate">
              {row[titleCol]}
            </span>
            {metaCols.length > 0 && (
              <span className="flex flex-wrap gap-x-2 mt-0.5">
                {metaCols.map((i) => (
                  <Meta key={i} tone="faint">
                    {table.header[i]}: {row[i]}
                  </Meta>
                ))}
              </span>
            )}
          </span>
          {numericCol !== titleCol && (
            <span className="shrink-0 font-display-app text-[17px] text-text tabular-nums">
              {row[numericCol]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
