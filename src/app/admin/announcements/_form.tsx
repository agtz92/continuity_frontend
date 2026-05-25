"use client";

import { useState } from "react";
import Link from "next/link";

export type FormState = {
  title: string;
  body: string;
  severity: string;
  audiencePlans: string[];
  audienceUserIds: string;
  startsAt: string;
  endsAt: string;
  dismissible: boolean;
  ctaLabel: string;
  ctaUrl: string;
};

export type AnnouncementSubmitInput = {
  title: string;
  body: string;
  severity: string;
  audiencePlans: string[];
  audienceUserIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  dismissible: boolean;
  ctaLabel: string;
  ctaUrl: string;
};

export function AnnouncementForm({
  initial,
  loading,
  onSubmit,
  submitLabel,
}: {
  initial: FormState;
  loading: boolean;
  onSubmit: (data: AnnouncementSubmitInput) => void;
  submitLabel: string;
}) {
  const [state, setState] = useState<FormState>(initial);

  const togglePlan = (plan: string) => {
    setState((s) => ({
      ...s,
      audiencePlans: s.audiencePlans.includes(plan)
        ? s.audiencePlans.filter((p) => p !== plan)
        : [...s.audiencePlans, plan],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: state.title.trim(),
      body: state.body,
      severity: state.severity,
      audiencePlans: state.audiencePlans,
      audienceUserIds: state.audienceUserIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      startsAt: state.startsAt ? new Date(state.startsAt).toISOString() : null,
      endsAt: state.endsAt ? new Date(state.endsAt).toISOString() : null,
      dismissible: state.dismissible,
      ctaLabel: state.ctaLabel,
      ctaUrl: state.ctaUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text">Anuncio</h1>
        <Link
          href="/admin/announcements"
          className="text-sm text-text-muted hover:text-text"
        >
          ← Volver
        </Link>
      </div>

      <Field label="Título *">
        <input
          type="text"
          value={state.title}
          onChange={(e) => setState({ ...state, title: e.target.value })}
          required
          maxLength={200}
          className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
      </Field>

      <Field label="Cuerpo">
        <textarea
          value={state.body}
          onChange={(e) => setState({ ...state, body: e.target.value })}
          rows={4}
          className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent resize-none"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Severidad">
          <select
            value={state.severity}
            onChange={(e) => setState({ ...state, severity: e.target.value })}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          >
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </Field>
        <Field label="¿Cerrable por el usuario?">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.dismissible}
              onChange={(e) =>
                setState({ ...state, dismissible: e.target.checked })
              }
              className="accent-accent h-4 w-4"
            />
            {state.dismissible ? "Sí" : "No (permanente)"}
          </label>
        </Field>
      </div>

      <Field label="Audiencia — planes">
        <div className="flex flex-wrap gap-2">
          {["free", "pro", "studio", "admin"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlan(p)}
              className={
                "px-3 py-1 text-xs rounded-full border " +
                (state.audiencePlans.includes(p)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-text-muted hover:bg-bg")
              }
            >
              {p}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-1">
          Vacío + sin user_ids = se muestra a TODOS.
        </p>
      </Field>

      <Field label="Audiencia — usuarios específicos (UUIDs)">
        <textarea
          value={state.audienceUserIds}
          onChange={(e) =>
            setState({ ...state, audienceUserIds: e.target.value })
          }
          rows={3}
          placeholder="Uno por línea o separados por coma…"
          className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent resize-none font-mono"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Activo desde (opcional)">
          <input
            type="datetime-local"
            value={state.startsAt}
            onChange={(e) => setState({ ...state, startsAt: e.target.value })}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </Field>
        <Field label="Activo hasta (opcional)">
          <input
            type="datetime-local"
            value={state.endsAt}
            onChange={(e) => setState({ ...state, endsAt: e.target.value })}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="CTA — texto del botón">
          <input
            type="text"
            value={state.ctaLabel}
            onChange={(e) => setState({ ...state, ctaLabel: e.target.value })}
            maxLength={64}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </Field>
        <Field label="CTA — URL">
          <input
            type="text"
            value={state.ctaUrl}
            onChange={(e) => setState({ ...state, ctaUrl: e.target.value })}
            placeholder="https://… o /ruta-interna"
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Link
          href="/admin/announcements"
          className="px-4 py-2 text-sm rounded border border-border text-text hover:bg-bg"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading || !state.title.trim()}
          className="px-4 py-2 text-sm rounded bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>

      <div className="text-xs text-text-muted">
        Después de crear, ve a la lista y dale &quot;Publicar&quot; para que
        empiece a mostrarse.
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
