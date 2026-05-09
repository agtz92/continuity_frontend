"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Click-to-edit single-line input. Shows the current value styled as plain
 * text; clicking swaps to an input. Saves on blur or Enter; reverts on
 * Escape. The save callback is only fired when the value actually changed.
 */
export function InlineText({
  value,
  onSave,
  placeholder,
  className,
  inputClassName,
  ariaLabel,
}: {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
}) {
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };
  const revert = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            revert();
          }
        }}
        aria-label={ariaLabel}
        className={`bg-zinc-900 border border-emerald-500/40 rounded-md focus:outline-none ${inputClassName ?? ""}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={tCommon("clickToEdit")}
      aria-label={ariaLabel ?? tCommon("clickToEdit")}
      className={`text-left hover:bg-zinc-900/60 rounded transition-colors ${className ?? ""}`}
    >
      {value || (
        <span className="italic text-zinc-500">
          {placeholder ?? ""}
        </span>
      )}
    </button>
  );
}

/**
 * Click-to-edit multi-line textarea. Same behavior as InlineText except:
 *  - Enter inserts a newline (doesn't save)
 *  - Cmd/Ctrl+Enter saves
 *  - Escape reverts
 *  - Save still happens automatically on blur
 */
export function InlineTextarea({
  value,
  onSave,
  placeholder,
  className,
  textareaClassName,
  rows = 3,
  ariaLabel,
}: {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  rows?: number;
  ariaLabel?: string;
}) {
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      // Place cursor at end so user can keep typing without losing context
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
    }
  }, [editing]);

  const commit = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };
  const revert = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            revert();
          }
        }}
        aria-label={ariaLabel}
        rows={rows}
        className={`bg-zinc-900 border border-emerald-500/40 rounded-md px-2.5 py-2 text-sm resize-y w-full focus:outline-none ${textareaClassName ?? ""}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={tCommon("clickToEdit")}
      aria-label={ariaLabel ?? tCommon("clickToEdit")}
      className={`text-left w-full hover:bg-zinc-900/60 rounded transition-colors whitespace-pre-wrap ${className ?? ""}`}
    >
      {value || (
        <span className="italic text-zinc-500">
          {placeholder ?? ""}
        </span>
      )}
    </button>
  );
}
