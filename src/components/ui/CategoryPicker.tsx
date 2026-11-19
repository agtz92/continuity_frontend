"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useCategoryMutations } from "@/hooks/useCategoryMutations";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Category } from "@/lib/types";
import { CATEGORY_COLORS, categoryColorClass } from "@/lib/types";

import { BottomSheet } from "./BottomSheet";

/**
 * Selector de categoría con el tema de la app. Sustituye al `<select>` nativo
 * (que pinta el SO y no deja crear): filtra al escribir y, si no hay
 * coincidencia exacta, ofrece "Crear «texto»" con el siguiente color libre.
 * En móvil abre un BottomSheet en lugar del popover.
 */
export function CategoryPicker({
  value,
  categories,
  onChange,
  variant = "chip",
  className = "",
}: {
  value: string | null;
  categories: Category[];
  onChange: (next: string | null) => void;
  /** chip = pastilla compacta de cabecera; field = ancho completo de formulario. */
  variant?: "chip" | "field";
  className?: string;
}) {
  const t = useTranslations("categoryPicker");
  const isMobile = useIsMobile();
  const { createCategory } = useCategoryMutations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const current = value ? categories.find((c) => c.id === value) ?? null : null;
  const q = query.trim();
  const filtered = useMemo(
    () =>
      q
        ? categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
        : categories,
    [categories, q],
  );
  const exact = categories.some((c) => c.name.toLowerCase() === q.toLowerCase());
  const canCreate = q.length > 0 && !exact;

  // Opciones navegables: [sin categoría (solo sin búsqueda)], ...filtradas, [crear].
  type Opt = { kind: "none" } | { kind: "cat"; cat: Category } | { kind: "create" };
  const options: Opt[] = [
    ...(q ? [] : [{ kind: "none" } as Opt]),
    ...filtered.map((cat) => ({ kind: "cat", cat }) as Opt),
    ...(canCreate ? [{ kind: "create" } as Opt] : []),
  ];

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setError(false);
      return;
    }
    if (!isMobile) inputRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!isMobile && rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, isMobile]);

  const nextColor = () => {
    const used = new Set(categories.map((c) => c.color));
    return CATEGORY_COLORS.find((c) => !used.has(c)) ?? CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
  };

  const choose = async (opt: Opt) => {
    if (opt.kind === "none") onChange(null);
    else if (opt.kind === "cat") onChange(opt.cat.id);
    else {
      setBusy(true);
      setError(false);
      const created = await createCategory({ name: q, color: nextColor() });
      setBusy(false);
      if (!created) {
        setError(true);
        return;
      }
      onChange(created.id);
    }
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[active];
      if (opt && !busy) void choose(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  const dot = (color: string) => (
    <span className={`w-2 h-2 rounded-full shrink-0 ${categoryColorClass(color).dot}`} />
  );

  const trigger =
    variant === "chip" ? (
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        className={`text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1.5 hover:opacity-80 ${
          current
            ? categoryColorClass(current.color).chip
            : "bg-surface border-border text-text-muted border-dashed"
        }`}
      >
        {current && dot(current.color)}
        <span>{current ? current.name : t("none")}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm flex items-center gap-2 text-left focus:border-accent outline-none"
      >
        {current && dot(current.color)}
        <span className={`flex-1 truncate ${current ? "text-text" : "text-text-muted"}`}>
          {current ? current.name : t("none")}
        </span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>
    );

  const panel = (
    <div onKeyDown={onKeyDown}>
      <div className="p-2 border-b border-border">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          role="combobox"
          aria-controls={listId}
          aria-expanded
          aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
          className="w-full bg-transparent text-sm text-text placeholder:text-text-muted outline-none px-1 py-1"
        />
      </div>
      <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
        {options.map((opt, i) => {
          const isActive = i === active;
          const base = `mx-1 px-2 py-1.5 rounded text-sm flex items-center gap-2 cursor-pointer ${
            isActive ? "bg-accent-a14" : ""
          }`;
          const common = {
            id: `${listId}-${i}`,
            role: "option" as const,
            onMouseEnter: () => setActive(i),
            onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
            onClick: () => !busy && void choose(opt),
          };
          if (opt.kind === "none") {
            return (
              <li key="none" {...common} aria-selected={!value} className={`${base} text-text-muted border-b border-border pb-2 mb-1 rounded-b-none`}>
                <span className="w-2 h-2 rounded-full border border-dashed border-text-muted shrink-0" />
                <span className="flex-1">{t("none")}</span>
                {!value && <Check size={14} />}
              </li>
            );
          }
          if (opt.kind === "cat") {
            const selected = opt.cat.id === value;
            return (
              <li key={opt.cat.id} {...common} aria-selected={selected} className={`${base} text-text`}>
                {dot(opt.cat.color)}
                <span className="flex-1 truncate">{opt.cat.name}</span>
                {selected && <Check size={14} className="text-accent" />}
              </li>
            );
          }
          return (
            <li key="create" {...common} aria-selected={false} className={`${base} text-accent`}>
              <Plus size={14} className="shrink-0" />
              <span className="flex-1 truncate">
                {busy ? t("creating") : t("create", { name: q })}
              </span>
            </li>
          );
        })}
        {options.length === 0 && (
          <li className="px-3 py-2 text-sm text-text-muted">{t("empty")}</li>
        )}
      </ul>
      {error && <p className="px-3 pb-2 text-xs text-signal">{t("createError")}</p>}
    </div>
  );

  return (
    <div ref={rootRef} className={`relative ${variant === "field" ? "w-full" : "inline-block"} ${className}`}>
      {trigger}
      {open &&
        (isMobile ? (
          <BottomSheet title={t("label")} onClose={() => setOpen(false)}>
            {panel}
          </BottomSheet>
        ) : (
          <div
            className={`absolute z-50 mt-1 ${variant === "field" ? "left-0 right-0" : "left-0 w-60"} bg-surface border border-border rounded-lg shadow-lg overflow-hidden`}
          >
            {panel}
          </div>
        ))}
    </div>
  );
}
