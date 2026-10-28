"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { ADMIN_SEND_USER_EMAIL } from "@/lib/graphql";
import { toast } from "@/lib/toast";

export type DirectEmail = {
  id: string;
  created: string;
  subject: string;
  body: string;
  locale: string;
  status: string;
  error: string;
};

type Locale = "es" | "en";

type Preset = {
  id: string;
  label: string;
  copy: Record<Locale, { subject: string; body: string }>;
};

// Copy the admin starts from; everything stays editable before sending.
// {{greeting}} / {{first_name}} are filled in by the backend per user.
const PRESETS: Preset[] = [
  {
    id: "studio_3m_no_projects",
    label: "Studio 3 meses — no creó proyectos",
    copy: {
      es: {
        subject: "¿Te regalo 3 meses de Studio?",
        body: `{{greeting}},

Vi que creaste tu cuenta en continuu, pero todavía no has hecho ningún proyecto.

¿Te interesaría seguir usando la herramienta si te regalamos Studio por 3 meses? No tienes que ingresar ningún método de pago. Lo que queremos a cambio es tu feedback.

Si te late, responde a este correo y te lo activo.

Alfredo`,
      },
      en: {
        subject: "3 months of Studio, on us?",
        body: `{{greeting}},

I saw you created your continuu account but haven't made a project yet.

Would you keep using it if we gave you Studio free for 3 months? No payment method needed. All we want in return is your feedback.

If you're up for it, just reply to this email and I'll turn it on.

Alfredo`,
      },
    },
  },
];

const STATUS_STYLES: Record<string, string> = {
  sent: "text-accent",
  failed: "text-red-400",
};

export function SendUserEmailCard({
  userId,
  email,
  emailLocale,
  lifecycleEmailsEnabled,
  history,
  onSent,
}: {
  userId: string;
  email: string;
  emailLocale: string;
  lifecycleEmailsEnabled: boolean;
  history: DirectEmail[];
  onSent: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [presetId, setPresetId] = useState("");
  const [locale, setLocale] = useState<Locale>(
    emailLocale === "es" ? "es" : "en"
  );

  const [send, { loading }] = useMutation(ADMIN_SEND_USER_EMAIL, {
    onCompleted: () => {
      toast.success(`Correo enviado a ${email}`);
      setSubject("");
      setBody("");
      setPresetId("");
      onSent();
    },
    onError: (e) => {
      toast.error(e.message);
      // A provider failure is still logged; show it in the history.
      onSent();
    },
  });

  const applyPreset = (id: string, loc: Locale) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    if (
      (subject || body) &&
      !confirm("Reemplazar lo que ya escribiste con la plantilla?")
    ) {
      return;
    }
    setSubject(preset.copy[loc].subject);
    setBody(preset.copy[loc].body);
  };

  const canSend =
    lifecycleEmailsEnabled && subject.trim() !== "" && body.trim() !== "";

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-text">Enviar correo</h2>
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4 text-sm">
        {!lifecycleEmailsEnabled && (
          <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-400">
            Este usuario se dio de baja de los correos de producto. No se le
            puede escribir desde aquí.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-text-muted">Plantilla</span>
            <select
              value={presetId}
              onChange={(e) => {
                setPresetId(e.target.value);
                applyPreset(e.target.value, locale);
              }}
              className="rounded border border-border bg-bg px-2 py-1 text-text outline-none focus:border-accent"
            >
              <option value="">Escribir desde cero</option>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-text-muted">Idioma</span>
            <select
              value={locale}
              onChange={(e) => {
                const next = e.target.value as Locale;
                setLocale(next);
                if (presetId) applyPreset(presetId, next);
              }}
              className="rounded border border-border bg-bg px-2 py-1 text-text outline-none focus:border-accent"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <span className="text-xs text-text-muted">
            Su app está en {emailLocale === "es" ? "español" : "inglés"}
          </span>
        </div>

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto"
          maxLength={200}
          className="w-full rounded border border-border bg-bg px-3 py-2 text-text outline-none focus:border-accent"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mensaje. Deja una línea en blanco entre párrafos."
          rows={12}
          maxLength={10000}
          className="w-full rounded border border-border bg-bg px-3 py-2 font-mono text-xs leading-relaxed text-text outline-none focus:border-accent"
        />
        <p className="text-xs text-text-muted">
          Sale de alfredo@continuu.it; las respuestas llegan a
          hello@continuu.it dirigidas a &quot;continuu · Nombre&quot;, para
          saber de quién es sin abrirla.{" "}
          <code>{"{{greeting}}"}</code> se vuelve &quot;Hola Nombre&quot; /
          &quot;Hi Name&quot; según su idioma; <code>{"{{first_name}}"}</code>{" "}
          es solo el nombre. Se agrega el pie de baja.
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canSend || loading}
            onClick={() => {
              if (!confirm(`Enviar "${subject.trim()}" a ${email}?`)) return;
              send({ variables: { userId, subject, body } });
            }}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Enviar"}
          </button>
        </div>

        {history.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-text-muted">
              Enviados
            </div>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <details>
                    <summary className="flex cursor-pointer flex-wrap gap-x-3">
                      <span className="text-text">{h.subject}</span>
                      <span className="text-text-muted">
                        {new Date(h.created).toLocaleString()}
                      </span>
                      <span className={STATUS_STYLES[h.status] ?? "text-text-muted"}>
                        {h.status}
                      </span>
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded bg-bg p-3 font-mono text-xs text-text-muted">
                      {h.body}
                    </pre>
                    {h.error && (
                      <p className="mt-1 text-xs text-red-400">{h.error}</p>
                    )}
                  </details>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
