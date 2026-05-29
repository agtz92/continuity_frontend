"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Film,
  Youtube,
  Table as TableIcon,
  Highlighter,
  Palette,
  Minus,
  Undo,
  Redo,
} from "lucide-react";
import { Video } from "./tiptap/VideoNode";
import { EmbedModal } from "./tiptap/EmbedModal";
import { MediaPickerModal } from "./MediaPickerModal";

type UploadResult = {
  publicUrl: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

type RichEditorProps = {
  initialContent: object | null;
  onChange: (doc: object) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  onUploadMedia?: (file: File) => Promise<UploadResult | null>;
  placeholder?: string;
};

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

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

export function RichEditor({
  initialContent,
  onChange,
  onUploadImage,
  onUploadMedia,
  placeholder,
}: RichEditorProps) {
  const lastEmittedRef = useRef<string>("");
  const [embedOpen, setEmbedOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Video,
    ],
    content:
      initialContent && Object.keys(initialContent).length > 0
        ? initialContent
        : EMPTY_DOC,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[24rem] focus:outline-none prose dark:prose-invert max-w-none text-text",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const serialized = JSON.stringify(json);
      if (serialized !== lastEmittedRef.current) {
        lastEmittedRef.current = serialized;
        onChange(json);
      }
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor || !initialContent) return;
    const incoming = JSON.stringify(initialContent);
    if (incoming === lastEmittedRef.current) return;
    lastEmittedRef.current = incoming;
    editor.commands.setContent(initialContent);
  }, [editor, initialContent]);

  const insertImageUrl = useCallback(
    (url: string) => {
      if (!editor) return;
      const alt = decodeURIComponent(url.split("/").pop() ?? "").split("?")[0];
      editor.chain().focus().setImage({ src: url, alt }).run();
    },
    [editor]
  );

  const insertVideoFile = useCallback(async () => {
    if (!editor || !onUploadMedia) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const result = await onUploadMedia(file);
      if (!result) return;
      editor
        .chain()
        .focus()
        .setVideo({
          src: result.publicUrl,
          provider: "file",
          width: result.width ?? null,
          height: result.height ?? null,
        })
        .run();
    };
    input.click();
  }, [editor, onUploadMedia]);

  const insertLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
        Cargando editor…
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface">
      <Toolbar
        editor={editor}
        onImage={onUploadImage ? () => setImagePickerOpen(true) : null}
        onVideoFile={onUploadMedia ? insertVideoFile : null}
        onEmbed={() => setEmbedOpen(true)}
        onLink={insertLink}
      />
      <div className="px-4 py-3" data-placeholder={placeholder}>
        <EditorContent editor={editor} />
      </div>
      <EmbedModal
        open={embedOpen}
        onClose={() => setEmbedOpen(false)}
        onSubmit={({ src, provider, caption }) => {
          editor.chain().focus().setVideo({ src, provider, caption }).run();
          setEmbedOpen(false);
        }}
      />
      <MediaPickerModal
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        defaultBucket="cms-media"
        onUpload={onUploadImage ?? undefined}
        onSelect={(url) => {
          insertImageUrl(url);
          setImagePickerOpen(false);
        }}
      />
    </div>
  );
}

function Toolbar({
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
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-bg/40 px-2 py-1.5">
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
          ? "bg-accent/20 text-accent"
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
