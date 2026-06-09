"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  /** Current topic text (a suggestion label or free-typed text). */
  value: string;
  onChange: (topic: string) => void;
  /** Localized suggestion labels for the common bug topics. */
  options: string[];
  placeholder: string;
  disabled?: boolean;
};

/**
 * Autocomplete combobox for the bug-report topic. The input IS the topic: the
 * user can pick a common suggestion OR type their own text freely. Suggestions
 * filter as you type; nothing is forced.
 */
export function BugTopicSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, value]);

  useEffect(() => {
    setHighlight(-1);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open || highlight < 0 || !listRef.current) return;
    listRef.current
      .querySelector<HTMLElement>(`[data-topic-idx="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const commit = (topic: string) => {
    onChange(topic);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && highlight >= 0 && filtered[highlight]) {
        e.preventDefault();
        commit(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className="bg-surface border border-border rounded-lg pl-3 pr-9 py-2 text-sm w-full"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="bug-topic-listbox"
          role="combobox"
          spellCheck={false}
          autoComplete="off"
        />
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          id="bug-topic-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-64 overflow-auto bg-surface border border-border rounded-lg shadow-lg"
        >
          {filtered.map((opt, idx) => {
            const isHighlighted = idx === highlight;
            const isSelected = opt === value;
            return (
              <button
                type="button"
                key={opt}
                data-topic-idx={idx}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(opt);
                }}
                onMouseEnter={() => setHighlight(idx)}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-accent/10 ${
                  isHighlighted ? "bg-accent/10" : ""
                } ${isSelected ? "font-medium text-accent" : ""}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
