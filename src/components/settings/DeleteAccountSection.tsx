"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { DELETE_ACCOUNT } from "@/lib/graphql";
import { supabase } from "@/lib/supabase";
import { clearCaptureStorage } from "@/lib/captureQueue";

/**
 * Borrar la cuenta desde la web (en móvil ya existía). Dos pasos: el botón abre
 * la confirmación, y el borrado solo se habilita al escribir el correo de la
 * cuenta. No cancela la suscripción, por eso el aviso enlaza a Facturación.
 */
export function DeleteAccountSection({ email }: { email: string }) {
  const t = useTranslations("settings.deleteAccount");
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState(false);
  const [deleteAccount, { loading }] = useMutation(DELETE_ACCOUNT);

  const matches =
    email !== "—" && typed.trim().toLowerCase() === email.trim().toLowerCase();

  const handleDelete = async () => {
    if (!matches || loading) return;
    setError(false);
    try {
      await deleteAccount();
    } catch {
      setError(true);
      return;
    }
    clearCaptureStorage();
    // La sesión ya no apunta a nada: se cierra y se sale de la app.
    await supabase.auth.signOut().catch(() => {});
    window.location.replace("/");
  };

  return (
    <section className="bg-surface border border-signal-a50 rounded-lg p-5 space-y-4">
      <div>
        <div className="text-sm font-medium text-signal">{t("title")}</div>
        <p className="mt-1 text-sm text-text-muted">{t("body")}</p>
      </div>
      <div className="flex items-start gap-2 rounded-md bg-signal-a12 px-3 py-2 text-xs text-text">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-signal" />
        <span>
          {t("subscriptionWarningWeb")}{" "}
          <Link href="/settings/billing" className="underline underline-offset-2">
            {t("manageSubscription")}
          </Link>
        </span>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-lg border border-signal-a50 text-sm text-signal hover:bg-signal-a12 transition-colors"
        >
          {t("button")}
        </button>
      ) : (
        <div className="space-y-3">
          <label className="block text-xs text-text-muted" htmlFor="delete-account-email">
            {t("typeEmail", { email })}
          </label>
          <input
            id="delete-account-email"
            type="email"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text sm:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!matches || loading}
              className="px-3 py-1.5 rounded-lg bg-signal text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? t("deleting") : t("confirm2Cta")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(false);
              }}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-border text-sm text-text hover:opacity-80"
            >
              {t("cancel")}
            </button>
          </div>
          {error && <p className="text-xs text-signal">{t("error")}</p>}
        </div>
      )}
    </section>
  );
}
