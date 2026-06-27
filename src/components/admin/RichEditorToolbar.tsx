"use client";

/**
 * Toolbar del RichEditor (formato, alineación, listas, tabla, color, media) +
 * sus piezas (`Btn`, `ColorPicker`, `Sep`) y la paleta de color. Extraído de
 * RichEditor.tsx (ver AUDITORIA_CODIGO.md); opera sobre la instancia `editor`.
 */

import { useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Film,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo,
  Youtube,
} from "lucide-react";

const PALETTE = [
  "#111827",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
];

export function Toolbar({
  editor,
  onImage,
  onVideoFile,
  onEmbed,
  onLink,
}: {
  editor: Editor;
  onImage: (() => void) | null;
  onVideoFile: (() => void) | null;
  onEmbed: () => void;
  onLink: () => void;
}) {
  return (
    <div className="sticky top-[60px] z-10 flex flex-wrap items-center gap-1 rounded-t-md border-b border-border bg-surface px-2 py-1.5 md:top-0">
      <Btn label="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn label="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn label="Subrayado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="h-4 w-4" />
      </Btn>
      <Btn label="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </Btn>
      <Sep />
      <Btn
        label="Título 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Btn>
      <Btn
        label="Título 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Btn>
      <Btn
        label="Título 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Btn>
      <Sep />
      <Btn label="Alinear izquierda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft className="h-4 w-4" />
      </Btn>
      <Btn label="Centrar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter className="h-4 w-4" />
      </Btn>
      <Btn label="Alinear derecha" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight className="h-4 w-4" />
      </Btn>
      <Btn label="Justificar" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
        <AlignJustify className="h-4 w-4" />
      </Btn>
      <Sep />
      <ColorPicker
        label="Color de texto"
        icon={<Palette className="h-4 w-4" />}
        onPick={(c) => editor.chain().focus().setColor(c).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <ColorPicker
        label="Resaltar"
        icon={<Highlighter className="h-4 w-4" />}
        onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />
      <Sep />
      <Btn label="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Btn>
      <Btn label="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Btn>
      <Btn label="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </Btn>
      <Btn label="Bloque de código" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code className="h-4 w-4" />
      </Btn>
      <Btn
        label="Insertar tabla"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon className="h-4 w-4" />
      </Btn>
      <Sep />
      <Btn label="Enlace" active={editor.isActive("link")} onClick={onLink}>
        <LinkIcon className="h-4 w-4" />
      </Btn>
      {onImage && (
        <Btn label="Insertar imagen" onClick={onImage}>
          <ImageIcon className="h-4 w-4" />
        </Btn>
      )}
      {onVideoFile && (
        <Btn label="Subir video" onClick={onVideoFile}>
          <Film className="h-4 w-4" />
        </Btn>
      )}
      <Btn label="YouTube / Vimeo" onClick={onEmbed}>
        <Youtube className="h-4 w-4" />
      </Btn>
      <Sep />
      <Btn label="Línea horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </Btn>
      <Btn label="Deshacer" onClick={() => editor.chain().focus().undo().run()}>
        <Undo className="h-4 w-4" />
      </Btn>
      <Btn label="Rehacer" onClick={() => editor.chain().focus().redo().run()}>
        <Redo className="h-4 w-4" />
      </Btn>
    </div>
  );
}

function Btn({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded text-xs transition-colors " +
        (active
          ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-accent"
          : "text-text-muted hover:bg-bg hover:text-text")
      }
    >
      {children}
    </button>
  );
}

function ColorPicker({
  label,
  icon,
  onPick,
  onClear,
}: {
  label: string;
  icon: React.ReactNode;
  onPick: (color: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg hover:text-text"
      >
        {icon}
      </button>
      {open && (
        <div
          className="absolute left-0 top-8 z-20 flex flex-wrap gap-1 rounded border border-border bg-surface p-2 shadow-md"
          onMouseLeave={() => setOpen(false)}
        >
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onPick(c);
                setOpen(false);
              }}
              className="h-5 w-5 rounded border border-border"
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="ml-1 rounded border border-border bg-bg px-2 text-[10px] text-text-muted hover:text-text"
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}

function Sep() {
  return <div className="mx-1 h-4 w-px bg-border" />;
}
