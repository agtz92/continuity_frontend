"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  getTimezoneGroups,
  isKnownTimezone,
  type TimezoneOption,
} from "@/lib/timezones";

type Props = {
  value: string;
  onChange: (tz: string) => void;
  disabled?: boolean;
  searchPlaceholder: string;
  emptyLabel: string;
};

export function TimezoneSelect({
  value,
  onChange,
  disabled,
  searchPlaceholder,
  emptyLabel,
}: Props) {
  const groups = useMemo(() => getTimezoneGroups(), []);
  const allFlat = useMemo<TimezoneOption[]>(
    () => groups.flatMap((g) => g.zones),
    [groups]
  );

  const currentLabel = useMemo(() => {
    const found = allFlat.find((z) => z.value === value);
    if (found) return found.label;
    if (value && !isKnownTimezone(value)) return `${value} (actual)`;
    return value;
  }, [allFlat, value]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        region: g.region,
        zones: g.zones.filter(
          (z) =>
            z.label.toLowerCase().includes(q) ||
            z.value.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.zones.length > 0);
  }, [groups, query]);

  const filteredFlat = useMemo<TimezoneOption[]>(
    () => filteredGroups.flatMap((g) => g.zones),
    [filteredGroups]
  );

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-tz-idx="${highlight}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const commit = (tz: string) => {
    onChange(tz);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => Math.min(h + 1, Math.max(filteredFlat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault();
        const pick = filteredFlat[highlight];
        if (pick) commit(pick.value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? query : currentLabel}
          placeholder={open ? searchPlaceholder : currentLabel}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className="bg-surface border border-border rounded-lg pl-3 pr-9 py-2 text-sm w-full"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="timezone-listbox"
          role="combobox"
          spellCheck={false}
          autoComplete="off"
        />
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </div>
      {open && (
        <div
          ref={listRef}
          id="timezone-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-72 overflow-auto bg-surface border border-border rounded-lg shadow-lg"
        >
          {filteredGroups.length === 0 ? (
            <div className="px-3 py-2 text-sm text-text-muted">
              {emptyLabel}
            </div>
          ) : (
            (() => {
              let running = 0;
              return filteredGroups.map((group) => {
                const start = running;
                running += group.zones.length;
                return (
                  <div key={group.region}>
                    <div className="sticky top-0 bg-bg px-3 py-1 text-xs uppercase tracking-wider text-text-muted border-b border-border">
                      {group.region}
                    </div>
                    {group.zones.map((tz, i) => {
                      const idx = start + i;
                      const isHighlighted = idx === highlight;
                      const isSelected = tz.value === value;
                      return (
                        <button
                          type="button"
                          key={tz.value}
                          data-tz-idx={idx}
                          role="option"
                          aria-selected={isSelected}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            commit(tz.value);
                          }}
                          onMouseEnter={() => setHighlight(idx)}
                          className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-accent/10 ${
                            isHighlighted ? "bg-accent/10" : ""
                          } ${isSelected ? "font-medium text-accent" : ""}`}
                        >
                          {tz.label}
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()
          )}
        </div>
      )}
    </div>
  );
}
