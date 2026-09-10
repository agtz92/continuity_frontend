"use client";

import { Calendar, X } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Category, Priority, ProjectStatus } from "@/lib/types";
import { PRIORITIES, categoryColorClass } from "@/lib/types";
import { priorityDotClass } from "@/lib/priority";
import { statusConfig } from "@/lib/status";

const STATUS_OPTIONS: ProjectStatus[] = [
  "idea",
  "active",
  "stalled",
  "paused",
  "launched",
  "killed",
  "archived",
];

/**
 * Los chips editables de la cabecera del detalle (estado, prioridad, categoría,
 * fecha). Extraídos de `ProjectDetailModal` para que `ProjectDetailPanel` los
 * use sin arrastrar el chasis del modal — cuando el detalle sea pantalla con
 * ruta propia (ola 4), estos se quedan donde están.
 */
export function StatusSelect({
  value,
  onChange,
  tStatus,
  StatusIcon,
}: {
  value: ProjectStatus;
  onChange: (next: ProjectStatus) => void;
  tStatus: ReturnType<typeof useTranslations>;
  StatusIcon: React.ComponentType<{ size?: number }> | undefined;
}) {
  return (
    <label
      className={`relative text-xs px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer hover:opacity-80 ${statusConfig[value]?.color}`}
    >
      {StatusIcon && <StatusIcon size={10} />}
      <span>{tStatus(value)}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProjectStatus)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={tStatus(value)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="bg-surface text-text">
            {tStatus(s)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrioritySelect({
  value,
  onChange,
  tPriority,
}: {
  value: Priority;
  onChange: (next: Priority) => void;
  tPriority: ReturnType<typeof useTranslations>;
}) {
  return (
    <label
      className="relative inline-flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
      title={tPriority(value)}
    >
      <span className={`w-3 h-3 rounded-full ${priorityDotClass[value]}`} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Priority)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={tPriority(value)}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p} className="bg-surface text-text">
            {tPriority(p)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DueDateSelect({
  value,
  onChange,
  locale,
  label,
  emptyLabel,
  clearLabel,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  locale: string;
  label: string;
  emptyLabel: string;
  clearLabel: string;
}) {
  const isoToInputDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const inputDateToIso = (s: string) => {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0).toISOString();
  };
  const display = value
    ? new Date(value).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : emptyLabel;

  return (
    <label
      className={`relative text-xs px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer hover:opacity-80 ${
        value
          ? "bg-surface border-border text-text"
          : "bg-surface border-border text-text-muted border-dashed"
      }`}
      title={label}
    >
      <Calendar size={10} />
      <span>{display}</span>
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(null);
          }}
          className="relative z-10 ml-0.5 text-text-muted hover:text-signal"
          aria-label={clearLabel}
        >
          <X size={10} />
        </button>
      )}
      <input
        type="date"
        value={isoToInputDate(value)}
        onChange={(e) => onChange(inputDateToIso(e.target.value))}
        onClick={(e) => {
          const el = e.currentTarget as HTMLInputElement & {
            showPicker?: () => void;
          };
          try {
            el.showPicker?.();
          } catch {
            /* showPicker unsupported / not allowed — fall back to native focus */
          }
        }}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={label}
      />
    </label>
  );
}

export function CategorySelect({
  value,
  categories,
  onChange,
  categoryById,
  tProjectModal,
}: {
  value: string | null;
  categories: Category[];
  onChange: (next: string | null) => void;
  categoryById: Record<string, Category>;
  tProjectModal: ReturnType<typeof useTranslations>;
}) {
  const current = value ? categoryById[value] : null;
  const cls = current ? categoryColorClass(current.color).chip : "";

  return (
    <label
      className={`relative text-xs px-2 py-0.5 rounded border cursor-pointer hover:opacity-80 ${
        current
          ? cls
          : "bg-surface border-border text-text-muted border-dashed"
      }`}
    >
      <span>{current ? current.name : tProjectModal("noCategory")}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={tProjectModal("category")}
      >
        <option value="" className="bg-surface text-text">
          {tProjectModal("noCategory")}
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id} className="bg-surface text-text">
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
