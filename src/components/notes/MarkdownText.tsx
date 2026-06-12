import React from "react";

/**
 * Tiny dependency-free Markdown renderer for Quick Note section bodies.
 * Supports a deliberate subset: headings, unordered and ordered lists, bold,
 * italic, inline code, and links. Anything else renders as plain text.
 * Read-only — editing happens in a textarea elsewhere.
 */

const INLINE =
  /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[2] !== undefined) nodes.push(<strong key={key}>{m[2]}</strong>);
    else if (m[4] !== undefined) nodes.push(<em key={key}>{m[4]}</em>);
    else if (m[6] !== undefined) nodes.push(<em key={key}>{m[6]}</em>);
    else if (m[8] !== undefined)
      nodes.push(
        <code key={key} className="rounded bg-bg px-1 py-0.5 text-[0.85em] font-mono">
          {m[8]}
        </code>
      );
    else if (m[10] !== undefined)
      nodes.push(
        <a
          key={key}
          href={m[11]}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline"
        >
          {m[10]}
        </a>
      );
    last = INLINE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let bi = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, idx) => (
      <li key={idx}>{renderInline(it, `li-${bi}-${idx}`)}</li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`b-${bi++}`} className="list-decimal pl-5 space-y-0.5">
          {items}
        </ol>
      ) : (
        <ul key={`b-${bi++}`} className="list-disc pl-5 space-y-0.5">
          {items}
        </ul>
      )
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);

    if (heading) {
      flushList();
      const level = heading[1].length;
      const cls =
        level === 1
          ? "text-base font-semibold"
          : level === 2
            ? "text-sm font-semibold"
            : "text-sm font-medium";
      blocks.push(
        <p key={`b-${bi++}`} className={`${cls} text-text`}>
          {renderInline(heading[2], `h-${bi}`)}
        </p>
      );
    } else if (ul) {
      if (list && list.ordered) flushList();
      if (!list) list = { ordered: false, items: [] };
      list.items.push(ul[1]);
    } else if (ol) {
      if (list && !list.ordered) flushList();
      if (!list) list = { ordered: true, items: [] };
      list.items.push(ol[1]);
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={`b-${bi++}`} className="text-sm leading-relaxed text-text break-words">
          {renderInline(line, `p-${bi}`)}
        </p>
      );
    }
  }
  flushList();

  return <div className="space-y-1.5">{blocks}</div>;
}
