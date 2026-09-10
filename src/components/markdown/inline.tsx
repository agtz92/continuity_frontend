import React from "react";

/**
 * El nivel de línea: negrita, cursiva, código y enlaces.
 *
 * Sale del `MarkdownText` original sin cambiarle la gramática — los tests de
 * caracterización la fijan— con **un cambio deliberado**: el código inline ya
 * no usa `font-mono`. El rediseño retiró esa familia (los metadatos van en
 * versalitas de la misma grotesca), así que un `font-mono` aquí pedía una
 * fuente que ya no se carga y caía al fallback del sistema.
 */

const INLINE =
  /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g;

/** Esquemas internos: `[Nombre](task:uuid)` no es un enlace, es un objeto. */
const ENTITY = /^(task|project|note):(.+)$/;

export interface InlineOptions {
  /**
   * Convierte `[Nombre](task:uuid)` en algo clicable. Si no se pasa, esos
   * enlaces se degradan a texto plano — nunca a un `href` roto.
   */
  renderEntity?: (
    type: "task" | "project" | "note",
    id: string,
    label: string,
    key: string
  ) => React.ReactNode;
}

export function renderInline(
  keyPrefix: string,
  text: string,
  { renderEntity }: InlineOptions = {}
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;

  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;

    if (m[2] !== undefined) {
      nodes.push(<strong key={key}>{m[2]}</strong>);
    } else if (m[4] !== undefined) {
      nodes.push(<em key={key}>{m[4]}</em>);
    } else if (m[6] !== undefined) {
      nodes.push(<em key={key}>{m[6]}</em>);
    } else if (m[8] !== undefined) {
      nodes.push(
        <code
          key={key}
          className="rounded-sm bg-line-08 px-1 py-0.5 text-[0.9em]"
        >
          {m[8]}
        </code>
      );
    } else if (m[10] !== undefined) {
      const label = m[10];
      const href = m[11];
      const entity = ENTITY.exec(href);
      if (entity) {
        const type = entity[1] as "task" | "project" | "note";
        const rendered = renderEntity?.(type, entity[2], label, key);
        // Sin resolutor o sin resolver: texto plano. Un enlace que no lleva a
        // ningún sitio es peor que no tener enlace.
        nodes.push(rendered ?? <React.Fragment key={key}>{label}</React.Fragment>);
      } else {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            {label}
          </a>
        );
      }
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
