"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Selector de fecha + hora con calendario propio.
 *
 * Existe porque `<input type="datetime-local">` solo abre un calendario en
 * algunos navegadores (Safari, por ejemplo, da puros steppers), y programar un
 * comunicado tecleando dígitos es justo donde uno se equivoca de mes. El valor
 * sigue siendo el mismo string local `"YYYY-MM-DDTHH:mm"` que usa el input
 * nativo, así que es reemplazo directo donde ya se guardaba eso.
 *
 * Cadena vacía = sin fecha, que para los comunicados significa "sin límite por
 * ese lado".
 */

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

type Parts = { y: number; m: number; d: number; time: string };

function parse(value: string): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return {
    y: Number(m[1]),
    m: Number(m[2]) - 1,
    d: Number(m[3]),
    time: `${m[4]}:${m[5]}`,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

function serialize(p: Parts): string {
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}T${p.time}`;
}

function format(p: Parts): string {
  const date = new Date(p.y, p.m, p.d);
  const weekday = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][
    date.getDay()
  ];
  return `${weekday} ${p.d} ${MONTHS[p.m].slice(0, 3)} ${p.y} · ${p.time}`;
}

function nowParts(): Parts {
  const d = new Date();
  return {
    y: d.getFullYear(),
    m: d.getMonth(),
    d: d.getDate(),
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function shiftDays(p: Parts, days: number): Parts {
  const d = new Date(p.y, p.m, p.d + days);
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), time: p.time };
}

/** Lunes primero: los domingos de JS (0) se van al final de la semana. */
function firstWeekdayOffset(y: number, m: number): number {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

export function DateTimeField({
  value,
  onChange,
  defaultTime = "09:00",
  placeholder = "Sin definir",
}: {
  value: string;
  onChange: (next: string) => void;
  /** Hora que se asume cuando se elige un día y todavía no había valor. */
  defaultTime?: string;
  placeholder?: string;
}) {
  const parsed = useMemo(() => parse(value), [value]);
  const [open, setOpen] = useState(false);
  // Mes que se está hojeando; arranca en el del valor, o en el actual.
  const [view, setView] = useState(() => {
    const p = parsed ?? nowParts();
    return { y: p.y, m: p.m };
  });
  const root = useRef<HTMLDivElement>(null);

  // Al reabrir, volver al mes del valor: hojear y cerrar sin elegir no debe
  // dejar el calendario en otro mes la próxima vez.
  useEffect(() => {
    if (!open) return;
    const p = parsed ?? nowParts();
    setView({ y: p.y, m: p.m });
  }, [open, parsed]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const commit = (p: Parts) => onChange(serialize(p));

  const pickDay = (day: number) => {
    commit({
      y: view.y,
      m: view.m,
      d: day,
      time: parsed?.time ?? defaultTime,
    });
  };

  const setTime = (time: string) => {
    if (!time) return;
    const base = parsed ?? nowParts();
    commit({ ...base, time });
  };

  const today = nowParts();
  const offset = firstWeekdayOffset(view.y, view.m);
  const total = daysInMonth(view.y, view.m);
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const presets: { label: string; parts: () => Parts }[] = [
    { label: "Ahora", parts: nowParts },
    { label: "Hoy 23:59", parts: () => ({ ...nowParts(), time: "23:59" }) },
    {
      label: "Mañana 09:00",
      parts: () => ({ ...shiftDays(nowParts(), 1), time: "09:00" }),
    },
    {
      label: "En 7 días",
      parts: () => shiftDays(parsed ?? nowParts(), 7),
    },
  ];

  return (
    <div className="relative" ref={root}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 rounded border border-border bg-bg px-3 py-2 text-left text-sm text-text outline-none hover:border-accent focus:border-accent"
        >
          <CalendarDays size={15} className="shrink-0 text-text-muted" />
          <span className={parsed ? "" : "text-text-muted"}>
            {parsed ? format(parsed) : placeholder}
          </span>
        </button>
        {parsed && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            aria-label="Quitar fecha"
            title="Quitar fecha"
            className="rounded border border-border p-2 text-text-muted hover:text-text"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-[19rem] rounded-lg border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => commit(p.parts())}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-text-muted hover:border-accent hover:text-text"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mb-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setView((v) =>
                  v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }
                )
              }
              aria-label="Mes anterior"
              className="rounded p-1 text-text-muted hover:bg-bg hover:text-text"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-medium text-text">
              {MONTHS[view.m]} {view.y}
            </div>
            <button
              type="button"
              onClick={() =>
                setView((v) =>
                  v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }
                )
              }
              aria-label="Mes siguiente"
              className="rounded p-1 text-text-muted hover:bg-bg hover:text-text"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((w, i) => (
              <div key={`${w}-${i}`} className="py-1 text-[10px] uppercase tracking-wide text-text-muted">
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} />;
              const isSelected =
                parsed?.y === view.y && parsed?.m === view.m && parsed?.d === day;
              const isToday =
                today.y === view.y && today.m === view.m && today.d === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  aria-current={isSelected ? "date" : undefined}
                  className={
                    "rounded py-1.5 text-sm transition-colors " +
                    (isSelected
                      ? "bg-accent font-medium text-bg"
                      : isToday
                        ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent"
                        : "text-text hover:bg-bg")
                  }
                >
                  {day}
                </button>
              );
            })}
          </div>

          <label className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs uppercase tracking-wide text-text-muted">
            Hora
            <input
              type="time"
              value={parsed?.time ?? defaultTime}
              onChange={(e) => setTime(e.target.value)}
              className="rounded border border-border bg-bg px-2 py-1 text-sm normal-case tracking-normal text-text outline-none focus:border-accent"
            />
          </label>
        </div>
      )}
    </div>
  );
}
