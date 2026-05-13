"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useRef } from "react";

type RichEditorProps = {
  initialContent: object | null;
  onChange: (doc: object) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  placeholder?: string;
};

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export function RichEditor({
  initialContent,
  onChange,
  onUploadImage,
  placeholder,
}: RichEditorProps) {
  const lastEmittedRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content:
      initialContent && Object.keys(initialContent).length > 0
        ? initialContent
        : EMPTY_DOC,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[24rem] focus:outline-none prose prose-invert max-w-none",
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

  const insertImage = useCallback(async () => {
    if (!editor || !onUploadImage) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await onUploadImage(file);
      if (!url) return;
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    };
    input.click();
  }, [editor, onUploadImage]);

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
        onImage={onUploadImage ? insertImage : null}
        onLink={insertLink}
      />
      <div className="px-4 py-3" data-placeholder={placeholder}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({
  editor,
  onImage,
  onLink,
}: {
  editor: Editor;
  onImage: (() => void) | null;
  onLink: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-bg/40 px-2 py-1.5">
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        Bold
      </Btn>
      <Btn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </Btn>
      <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        Strike
      </Btn>
      <Sep />
      <Btn
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        H1
      </Btn>
      <Btn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H2
      </Btn>
      <Btn
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        H3
      </Btn>
      <Sep />
      <Btn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </Btn>
      <Btn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </Btn>
      <Btn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        Quote
      </Btn>
      <Btn
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        Code
      </Btn>
      <Sep />
      <Btn active={editor.isActive("link")} onClick={onLink}>
        Link
      </Btn>
      {onImage && <Btn onClick={onImage}>Image</Btn>}
      <Sep />
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        Hr
      </Btn>
      <Btn onClick={() => editor.chain().focus().undo().run()}>Undo</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()}>Redo</Btn>
    </div>
  );
}

function Btn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded px-2 py-1 text-xs transition-colors " +
        (active
          ? "bg-accent/20 text-accent"
          : "text-text-muted hover:bg-bg hover:text-text")
      }
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-4 w-px bg-border" />;
}
