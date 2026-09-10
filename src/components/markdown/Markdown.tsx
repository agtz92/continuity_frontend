"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { parseMarkdown, visibleColumnCount, type Block } from "./parse";
import { renderInline, type InlineOptions } from "./inline";
import { MdTable } from "./MdTable";
import { MdTableRows } from "./MdTableRows";

/**
 * El renderer de markdown del producto, uno para notas y para el chat.
 *
 * `variant` no cambia lo que se parsea, solo cómo se viste: en una nota el
 * cuerpo es el de la app; en el chat es el cuerpo de lectura del rediseño
 * (15px / 1.6), que es lo que hace que una respuesta larga se lea en vez de
 * escanearse.
 *
 * **El umbral de las tablas.** Cuatro columnas o menos → tabla real. Cinco o
 * más → filas. Lo decide el renderer contando columnas **visibles**: una
 * columna que el modelo dejó entera vacía no cuenta, porque no se pinta.
 */

/** Cuatro columnas es lo que cabe en el panel sin romper nada. */
export const MAX_TABLE_COLUMNS = 4;

export type MarkdownVariant = "note" | "chat";

export function Markdown({
  text,
  variant = "note",
  streaming = false,
  renderEntity,
}: {
  text: string;
  variant?: MarkdownVariant;
  /** El stream sigue abierto: el último bloque puede estar a medias. */
  streaming?: boolean;
} & InlineOptions) {
  const blocks = useMemo(
    () => parseMarkdown(text, { streaming }),
    [text, streaming]
  );

  const body =
    variant === "chat"
      ? "text-[15px] leading-[1.6] text-text-2 break-words"
      : "text-sm leading-relaxed text-text break-words";

  return (
    <div className={variant === "chat" ? "space-y-2" : "space-y-1.5"}>
      {blocks.map((b, i) => (
        <BlockView
          key={i}
          block={b}
          index={i}
          bodyClass={body}
          inline={{ renderEntity }}
        />
      ))}
    </div>
  );
}

function BlockView({
  block,
  index,
  bodyClass,
  inline,
}: {
  block: Block;
  index: number;
  bodyClass: string;
  inline: InlineOptions;
}) {
  const t = useTranslations("assistant.markdown");

  switch (block.kind) {
    case "heading": {
      // Deliberado desde el original: <p> con peso, no <h1>. Estos bloques
      // viven DENTRO de una nota o de un mensaje, y un <h1> real rompería la
      // jerarquía del documento que los contiene.
      const cls =
        block.level === 1
          ? "text-base font-semibold"
          : block.level === 2
            ? "text-sm font-semibold"
            : "text-sm font-medium";
      return (
        <p className={`${cls} text-text`}>
          {renderInline(`h-${index}`, block.text, inline)}
        </p>
      );
    }

    case "list": {
      const items = block.items.map((it, idx) => (
        <li key={idx}>{renderInline(`li-${index}-${idx}`, it, inline)}</li>
      ));
      return block.ordered ? (
        <ol className="list-decimal pl-5 space-y-0.5">{items}</ol>
      ) : (
        <ul className="list-disc pl-5 space-y-0.5">{items}</ul>
      );
    }

    case "table":
      return visibleColumnCount(block) > MAX_TABLE_COLUMNS ? (
        <MdTableRows table={block} />
      ) : (
        <MdTable table={block} />
      );

    case "incomplete":
      // Mientras llegan filas, texto tenue. Una tabla que crece columna a
      // columna reflowea el panel tres veces por segundo.
      return (
        <div className="text-xs text-text-4 italic animate-pulse">
          {t("writingTable")}
        </div>
      );

    default:
      return <p className={bodyClass}>{renderInline(`p-${index}`, block.text, inline)}</p>;
  }
}
