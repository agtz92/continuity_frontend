"use client";

/**
 * SlashMenu — menú "/" del RichEditor (lista de comandos filtrable + navegación
 * por teclado). Extraído de RichEditor.tsx (ver AUDITORIA_CODIGO.md). El tipo
 * `SlashCommand` vive aquí porque lo comparten el editor y el menú.
 */

import { type Editor } from "@tiptap/react";

export type SlashCommand = {
  title: string;
  keywords: string;
  icon: React.ReactNode;
  run: (editor: Editor) => void;
};

export function SlashMenu({
  items,
  activeIndex,
  top,
  left,
  onPick,
}: {
  items: SlashCommand[];
  activeIndex: number;
  top: number;
  left: number;
  onPick: (cmd: SlashCommand) => void;
}) {
  return (
    <div
      className="fixed z-50 max-h-72 w-60 overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-xl"
      style={{ top, left }}
    >
      {items.map((cmd, i) => (
        <button
          key={cmd.title}
          type="button"
          // onMouseDown (not onClick) so the editor keeps its selection while we apply.
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(cmd);
          }}
          className={
            "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors " +
            (i === activeIndex
              ? "bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-accent"
              : "text-text hover:bg-bg")
          }
        >
          <span className="text-text-muted">{cmd.icon}</span>
          {cmd.title}
        </button>
      ))}
    </div>
  );
}
