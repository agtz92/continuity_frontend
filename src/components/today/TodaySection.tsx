"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Lock } from "lucide-react";
import type { ReactNode } from "react";
import type { TodaySectionId } from "@/lib/todaySections";

/**
 * Wraps a Today section. In normal mode, just renders the children
 * inline. In edit mode, replaces the children with a compact
 * "customization row" — drag handle on the left, icon + label in
 * the middle, eye toggle (or lock) on the right — and registers
 * itself with the dnd-kit SortableContext.
 */
export function TodaySection({
  id,
  editMode,
  hidden,
  hideable,
  label,
  icon,
  children,
  onToggleHide,
  hideLabels,
}: {
  id: TodaySectionId;
  editMode: boolean;
  hidden: boolean;
  hideable: boolean;
  label: string;
  icon: ReactNode;
  children: ReactNode;
  onToggleHide: () => void;
  hideLabels: { show: string; hide: string; locked: string; drag: string };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  if (!editMode) {
    return <>{children}</>;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 ${
        hidden
          ? "border-dashed border-border opacity-60"
          : "border-border"
      } ${isDragging ? "shadow-hard" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label={hideLabels.drag}
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-text-muted hover:text-text p-1 -ml-1"
      >
        <GripVertical size={18} />
      </button>

      <span className="shrink-0">{icon}</span>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="font-medium text-text truncate">{label}</span>
        {hidden && (
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-a12 text-accent border border-accent-a35">
            {hideLabels.hide}
          </span>
        )}
      </div>

      {hideable ? (
        <button
          type="button"
          onClick={onToggleHide}
          aria-label={hidden ? hideLabels.show : hideLabels.hide}
          aria-pressed={!hidden}
          className="shrink-0 p-1.5 rounded-md text-text-muted hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] transition-colors"
        >
          {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      ) : (
        <span
          aria-label={hideLabels.locked}
          title={hideLabels.locked}
          className="shrink-0 p-1.5 text-text-muted"
        >
          <Lock size={16} />
        </span>
      )}
    </div>
  );
}
