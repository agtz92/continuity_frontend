"use client";

import { EyeOff } from "lucide-react";

export function HiddenSectionsFooter({
  count,
  onCustomize,
  label,
}: {
  count: number;
  onCustomize: () => void;
  label: string;
}) {
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={onCustomize}
      className="w-full text-sm text-text-muted hover:text-text inline-flex items-center justify-center gap-2 py-3 border-t border-dashed border-border transition-colors"
    >
      <EyeOff size={14} />
      <span>{label}</span>
    </button>
  );
}
