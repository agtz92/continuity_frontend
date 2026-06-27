"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import type { EditorView } from "@tiptap/pm/view";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
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

import { Toolbar } from "./RichEditorToolbar";
import { SlashMenu, type SlashCommand } from "./RichEditorSlashMenu";

type RichEditorProps = {
  initialContent: object | null;
  onChange: (doc: object) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  onUploadMedia?: (file: File) => Promise<UploadResult | null>;
  placeholder?: string;
};

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };


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

  // Slash (/) command menu — lets the editor insert blocks (H2, image, list…)
  // at the cursor without scrolling up to the toolbar.
  const [slash, setSlash] = useState<{
    query: string;
    top: number;
    left: number;
  } | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const slashRef = useRef<{ open: boolean; items: SlashCommand[]; index: number }>(
    { open: false, items: [], index: 0 }
  );
  const applyCmdRef = useRef<(cmd: SlashCommand) => void>(() => {});

  // Keep the latest upload handler reachable from the editor's paste/drop
  // hooks, which are bound once when the editor is created.
  const onUploadImageRef = useRef(onUploadImage);
  useEffect(() => {
    onUploadImageRef.current = onUploadImage;
  }, [onUploadImage]);

  // Pasted/dropped image files must be uploaded to storage and inserted as
  // their public URL. Without this, the browser inserts a `blob:` URL that
  // dies with the session and gets stripped by the server-side renderer
  // (it only allows http/https), so the image silently vanishes once saved.
  const insertUploadedImages = useCallback(
    (view: EditorView, files: FileList | File[], pos?: number): boolean => {
      const images = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (images.length === 0) return false;
      const upload = onUploadImageRef.current;
      if (!upload) return false;
      void (async () => {
        for (const file of images) {
          const url = await upload(file);
          if (!url) continue;
          const imageType = view.state.schema.nodes.image;
          if (!imageType) continue;
          const node = imageType.create({ src: url, alt: file.name });
          const at = pos ?? view.state.selection.from;
          view.dispatch(view.state.tr.insert(at, node));
        }
      })();
      return true;
    },
    []
  );

  const syncSlash = useCallback((ed: Editor) => {
    const { selection } = ed.state;
    const { $from, empty } = selection;
    if (!empty || $from.parent.type.name !== "paragraph") {
      setSlash(null);
      return;
    }
    const text = $from.parent.textContent;
    if (!text.startsWith("/") || $from.parentOffset !== text.length) {
      setSlash(null);
      return;
    }
    const coords = ed.view.coordsAtPos($from.pos);
    setSlash({ query: text.slice(1), top: coords.bottom + 4, left: coords.left });
    setSlashIndex(0);
  }, []);

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
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          if (insertUploadedImages(view, files)) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = (event as DragEvent).dataTransfer?.files;
        if (files && files.length > 0) {
          const coords = view.posAtCoords({
            left: (event as DragEvent).clientX,
            top: (event as DragEvent).clientY,
          });
          if (insertUploadedImages(view, files, coords?.pos)) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (_view, event) => {
        const s = slashRef.current;
        if (!s.open || s.items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setSlashIndex((i) => (i + 1) % s.items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setSlashIndex((i) => (i - 1 + s.items.length) % s.items.length);
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          applyCmdRef.current(s.items[Math.min(s.index, s.items.length - 1)]);
          return true;
        }
        if (event.key === "Escape") {
          setSlash(null);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const serialized = JSON.stringify(json);
      if (serialized !== lastEmittedRef.current) {
        lastEmittedRef.current = serialized;
        onChange(json);
      }
      syncSlash(editor);
    },
    onSelectionUpdate: ({ editor }) => syncSlash(editor),
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
      // Only persist real, fetchable URLs. `blob:`/`data:` sources are
      // session-local previews that the server-side renderer strips.
      if (/^(blob:|data:)/i.test(url.trim())) return;
      const alt = decodeURIComponent(url.split("/").pop() ?? "").split("?")[0];
      editor.chain().focus().setImage({ src: url, alt }).run();
    },
    [editor]
  );

  const slashCommands = useMemo<SlashCommand[]>(() => {
    const list: SlashCommand[] = [
      {
        title: "Título 1",
        keywords: "h1 heading titulo encabezado",
        icon: <Heading1 className="h-4 w-4" />,
        run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        title: "Título 2",
        keywords: "h2 heading titulo encabezado subtitulo",
        icon: <Heading2 className="h-4 w-4" />,
        run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        title: "Título 3",
        keywords: "h3 heading titulo encabezado",
        icon: <Heading3 className="h-4 w-4" />,
        run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        title: "Lista con viñetas",
        keywords: "bullet list ul vinetas puntos",
        icon: <List className="h-4 w-4" />,
        run: (e) => e.chain().focus().toggleBulletList().run(),
      },
      {
        title: "Lista numerada",
        keywords: "ordered list ol numerada",
        icon: <ListOrdered className="h-4 w-4" />,
        run: (e) => e.chain().focus().toggleOrderedList().run(),
      },
      {
        title: "Cita",
        keywords: "quote blockquote cita",
        icon: <Quote className="h-4 w-4" />,
        run: (e) => e.chain().focus().toggleBlockquote().run(),
      },
      {
        title: "Bloque de código",
        keywords: "code codigo pre",
        icon: <Code className="h-4 w-4" />,
        run: (e) => e.chain().focus().toggleCodeBlock().run(),
      },
      {
        title: "Tabla",
        keywords: "table tabla",
        icon: <TableIcon className="h-4 w-4" />,
        run: (e) =>
          e
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
      },
      {
        title: "Línea horizontal",
        keywords: "divider hr separador linea",
        icon: <Minus className="h-4 w-4" />,
        run: (e) => e.chain().focus().setHorizontalRule().run(),
      },
    ];
    if (onUploadImage) {
      list.push({
        title: "Imagen",
        keywords: "image img imagen foto",
        icon: <ImageIcon className="h-4 w-4" />,
        run: () => setImagePickerOpen(true),
      });
    }
    return list;
  }, [onUploadImage]);

  const slashItems = useMemo(() => {
    if (!slash) return [];
    const q = slash.query.trim().toLowerCase();
    if (!q) return slashCommands;
    return slashCommands.filter((c) =>
      `${c.title} ${c.keywords}`.toLowerCase().includes(q)
    );
  }, [slash, slashCommands]);

  const activeIndex = slashItems.length
    ? Math.min(slashIndex, slashItems.length - 1)
    : 0;

  const applyCmd = useCallback(
    (cmd: SlashCommand) => {
      if (!editor || !cmd) return;
      const { $from } = editor.state.selection;
      const from = $from.start();
      const to = $from.pos;
      editor.chain().focus().deleteRange({ from, to }).run();
      cmd.run(editor);
      setSlash(null);
    },
    [editor]
  );

  useEffect(() => {
    slashRef.current = {
      open: !!slash && slashItems.length > 0,
      items: slashItems,
      index: activeIndex,
    };
  }, [slash, slashItems, activeIndex]);

  useEffect(() => {
    applyCmdRef.current = applyCmd;
  }, [applyCmd]);

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
      <div className="border-t border-border px-4 py-1.5 text-[11px] text-text-muted">
        Escribe <kbd className="rounded border border-border px-1">/</kbd> para
        insertar bloques · Markdown: <code>## </code> título, <code>- </code>{" "}
        lista, <code>&gt; </code> cita
      </div>
      {slash && slashItems.length > 0 && (
        <SlashMenu
          items={slashItems}
          activeIndex={activeIndex}
          top={slash.top}
          left={slash.left}
          onPick={applyCmd}
        />
      )}
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
