"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { emptyColumns, type TableBlock } from "./parse";
import { Meta } from "@/components/ui/Meta";
import { renderInline } from "./inline";

/** Más de esto y la tabla deja de leerse de un vistazo. */
const VISIBLE_ROWS = 5;

/**
 * Tabla real, para 4 columnas o menos.
 *
 * `<table>` de verdad con `<thead>` y `<th scope="col">`, no una rejilla de
 * divs: es lo único que un lector de pantalla puede recorrer por filas y
 * columnas.
 *
 * Dos reglas del panel de 448px:
 *
 * - **Nunca scroll horizontal.** Si no cabe, es que había que usar el otro
 *   modo — no esconder columnas detrás de un gesto.
 * - **Una columna que no pinta nada ocupa 0.** No se reparte el ancho entre
 *   columnas vacías; se colapsan y el espacio va a las que dicen algo.
 */
export function MdTable({ table }: { table: TableBlock }) {
  const t = useTranslations("assistant.markdown");
  const [expanded, setExpanded] = useState(false);

  const hidden = emptyColumns(table);
  const cols = table.header.map((_, i) => i).filter((i) => !hidden.has(i));

  const body = table.hasTotalRow ? table.rows.slice(0, -1) : table.rows;
  const total = table.hasTotalRow ? table.rows[table.rows.length - 1] : null;
  const shown = expanded ? body : body.slice(0, VISIBLE_ROWS);
  const rest = body.length - shown.length;

  const alignClass = (i: number) =>
    table.align[i] === "right"
      ? "text-right tabular-nums"
      : table.align[i] === "center"
        ? "text-center"
        : "text-left";

  return (
    <div className="my-3 border-y border-line-08">
      <table className="w-full table-auto">
        <thead>
          <tr>
            {cols.map((i) => (
              <th
                key={i}
                scope="col"
                className={`py-1.5 pr-2 last:pr-0 border-b border-line-14 ${alignClass(i)}`}
              >
                <Meta variant="cintillo" tone="faint">
                  {table.header[i]}
                </Meta>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((row, r) => (
            <tr key={r}>
              {cols.map((i) => (
                <td
                  key={i}
                  className={`py-1.5 pr-2 last:pr-0 text-[13px] align-baseline ${alignClass(i)} ${
                    // La primera columna visible es el sujeto de la fila.
                    i === cols[0] ? "font-semibold text-text" : "text-text-2"
                  }`}
                >
                  {renderInline(table.header[i] + r + i, row[i] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {total && (
          <tfoot>
            <tr className="bg-well">
              {cols.map((i) => (
                <td
                  key={i}
                  className={`py-2 pr-2 last:pr-0 ${alignClass(i)} ${
                    i === cols[0]
                      ? "text-text-3"
                      : "font-display-app text-[17px] text-text"
                  }`}
                >
                  {i === cols[0] ? (
                    <Meta variant="cintillo" tone="inherit">
                      {total[i]}
                    </Meta>
                  ) : (
                    total[i]
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>

      {rest > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          className="w-full flex items-center gap-1.5 py-2 text-text-4 hover:text-accent transition-colors duration-150 ease-out"
        >
          <ChevronDown size={12} />
          <Meta variant="cintillo" tone="inherit">
            {t("moreRows", { count: rest })}
          </Meta>
        </button>
      )}
    </div>
  );
}
