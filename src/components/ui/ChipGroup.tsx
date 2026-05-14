"use client";

import type { ReactNode } from "react";

export type ChipOption<V extends string> = {
  value: V;
  label: ReactNode;
  /** Optional leading icon/emoji rendered before the label. */
  prefix?: ReactNode;
};

/**
 * Single-select chip group. Touch-friendly (min 36px tall) and used in place of
 * `<select>` for low-cardinality enums (status, priority, recurrence type) where
 * surfacing the choices directly is faster than opening a dropdown.
 */
export function ChipGroup<V extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: V;
  options: ReadonlyArray<ChipOption<V>>;
  onChange: (next: V) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
              active
                ? "bg-accent text-bg border-accent"
                : "bg-border text-text-muted border-border hover:opacity-80"
            }`}
          >
            {opt.prefix}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
