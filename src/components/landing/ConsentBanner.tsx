"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { marketingHref } from "@/i18n/marketingHref";
import type { Locale } from "@/i18n/config";
import {
  readConsent,
  subscribeConsent,
  subscribeReopen,
  writeConsent,
} from "@/lib/analyticsConsent";

/**
 * Pregunta una vez si se permite Google Analytics. Aceptar y rechazar pesan lo
 * mismo; sin respuesta no se mide nada. El footer lo reabre con
 * "Preferencias de cookies". En el servidor no pinta nada (la decisión vive en
 * localStorage), así que las páginas siguen siendo estáticas.
 */
export default function ConsentBanner() {
  const t = useTranslations("landing.cookies");
  const locale = useLocale() as Locale;
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => "unknown" as const);
  const [reopened, setReopened] = useState(false);

  useEffect(() => subscribeReopen(() => setReopened(true)), []);

  if (consent === "unknown" || (consent !== null && !reopened)) return null;

  const choose = (value: "granted" | "denied") => {
    setReopened(false);
    writeConsent(value);
  };

  return (
    <div
      // Vive fuera del wrapper de cada página: lleva su propio ámbito de marca.
      data-surface="marketing"
      role="dialog"
      aria-live="polite"
      aria-label={t("title")}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-lg border border-white/10 bg-ls-navy p-5 shadow-2xl sm:inset-x-6"
    >
      <p className="text-sm text-ls-text-primary">
        {t("message")}{" "}
        <Link
          href={marketingHref(locale, "/privacy")}
          className="underline underline-offset-2 hover:text-ls-ochre"
        >
          {t("policy")}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-ls-text-primary hover:border-ls-ochre hover:text-ls-ochre"
        >
          {t("reject")}
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-ls-text-primary hover:border-ls-ochre hover:text-ls-ochre"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
