"use client";

/**
 * Second factor (TOTP) for the admin panel.
 *
 * The backend rejects every admin field with MFA_REQUIRED unless the JWT says
 * `aal: "aal2"` (`core/admin_api/permissions.py`). This screen gets the
 * session there:
 * - no verified TOTP factor yet → enroll: show the QR, ask for the first code;
 * - a verified factor → ask for the current code.
 * `challengeAndVerify` swaps the session for an aal2 one, and Apollo reads the
 * session on every request, so the panel works right after `onVerified`.
 *
 * The real enforcement is on the server; this is only the way in.
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Mode =
  | { kind: "loading" }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "challenge"; factorId: string }
  | { kind: "error"; message: string };

const FRIENDLY_NAME = "Continuity Admin";

export function AdminMfaGate({
  email,
  onVerified,
}: {
  email: string;
  onVerified: () => void;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Strict mode mounts twice; a second enroll would leave an orphan factor.
    if (started.current) return;
    started.current = true;
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setMode({ kind: "error", message: error.message });
        return;
      }
      const verified = data.totp.find((f) => f.status === "verified");
      if (verified) {
        setMode({ kind: "challenge", factorId: verified.id });
        return;
      }
      // An abandoned enrollment blocks a new one with the same name.
      for (const f of data.all) {
        if (f.factor_type === "totp" && f.status !== "verified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const enrolled = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: FRIENDLY_NAME,
      });
      if (enrolled.error) {
        setMode({ kind: "error", message: enrolled.error.message });
        return;
      }
      setMode({
        kind: "enroll",
        factorId: enrolled.data.id,
        qr: enrolled.data.totp.qr_code,
        secret: enrolled.data.totp.secret,
      });
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode.kind !== "enroll" && mode.kind !== "challenge") return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mode.factorId,
      code: code.trim(),
    });
    setSubmitting(false);
    if (error) {
      setError("Código incorrecto o vencido. Usa el que aparece ahora en tu app.");
      setCode("");
      return;
    }
    onVerified();
  }

  return (
    <div
      data-admin="true"
      className="min-h-screen bg-bg flex items-center justify-center px-6 py-10"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8">
        <h1 className="text-xl font-semibold text-text">
          {mode.kind === "enroll" ? "Activa la verificación en dos pasos" : "Verificación en dos pasos"}
        </h1>

        {mode.kind === "loading" && (
          <p className="mt-4 text-sm text-text-muted">Cargando…</p>
        )}

        {mode.kind === "error" && (
          <p className="mt-4 text-sm text-red-500">
            No se pudo preparar la verificación: {mode.message}
          </p>
        )}

        {mode.kind === "enroll" && (
          <div className="mt-3 space-y-4 text-sm text-text-muted">
            <p>
              El panel de admin pide un código de tu app de autenticación
              (Google Authenticator, 1Password, Authy…) además de la contraseña.
              Escanea el código QR con esa app:
            </p>
            <div className="flex justify-center">
              <img
                src={mode.qr}
                alt="Código QR para tu app de autenticación"
                width={192}
                height={192}
                className="rounded bg-white p-2"
              />
            </div>
            <p>
              ¿No puedes escanear? Escribe esta clave en la app:
              <code className="mt-1 block select-all break-all rounded bg-bg px-2 py-1 font-mono text-xs text-text">
                {mode.secret}
              </code>
            </p>
          </div>
        )}

        {mode.kind === "challenge" && (
          <p className="mt-3 text-sm text-text-muted">
            Escribe el código de 6 dígitos que muestra tu app de autenticación
            para <span className="text-text">{email}</span>.
          </p>
        )}

        {(mode.kind === "enroll" || mode.kind === "challenge") && (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label htmlFor="admin-mfa-code" className="block text-sm font-medium text-text">
              Código
            </label>
            <input
              id="admin-mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-text"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full rounded bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Verificando…" : "Verificar"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-6 text-xs text-text-muted hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
