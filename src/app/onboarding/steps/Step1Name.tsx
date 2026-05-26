"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export function Step1Name({
  initialName,
  isPrefillFromOAuth,
  onNext,
  busy,
}: {
  initialName: string;
  isPrefillFromOAuth: boolean;
  onNext: (name: string) => Promise<void> | void;
  busy: boolean;
}) {
  const t = useTranslations("onboarding");
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t("step1.errorEmpty"));
      return;
    }
    if (trimmed.length > 50) {
      setError(t("step1.errorTooLong"));
      return;
    }
    setError(null);
    await onNext(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-text">
          {t("step1.heading")}
        </h1>
        <p className="text-text-muted text-sm mt-2">{t("step1.sub")}</p>
      </div>

      <div>
        <label
          htmlFor="onboarding-first-name"
          className="block text-xs text-text-muted mb-1.5"
        >
          {t("step1.label")}
        </label>
        <input
          id="onboarding-first-name"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          maxLength={50}
          autoFocus
          autoComplete="given-name"
          placeholder={t("step1.placeholder")}
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          aria-invalid={!!error}
          aria-describedby={error ? "onboarding-first-name-error" : undefined}
        />
        {isPrefillFromOAuth && !error && (
          <p className="text-xs text-text-muted mt-1.5">
            {t("step1.helperPrefilled")}
          </p>
        )}
        {error && (
          <p
            id="onboarding-first-name-error"
            className="text-xs text-red-500 mt-1.5"
          >
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end mt-auto pt-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {t("next")}
        </button>
      </div>
    </form>
  );
}
