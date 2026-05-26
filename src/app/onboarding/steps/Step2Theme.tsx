"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { NOTIFICATION_SETTINGS_QUERY } from "@/lib/graphql";
import {
  DEFAULT_PALETTE,
  PALETTE_LABEL_KEY,
  PALETTE_SWATCHES,
  SUPPORTED_PALETTES,
  isPalette,
  type Palette,
} from "@/palette/config";
import {
  SUPPORTED_THEMES,
  THEME_LABEL_KEY,
  isTheme,
  type Theme,
} from "@/theme/config";

const ONBOARDING_DEFAULT_THEME: Theme = "light";
const ONBOARDING_DEFAULT_PALETTE: Palette = "midnight";

function applyThemeAttribute(theme: Theme) {
  if (typeof document === "undefined") return;
  const effective =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.dataset.theme = effective;
}

function detectEffectiveTheme(theme: Theme): "dark" | "light" | "continuuit" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function Step2Theme({
  onBack,
  onNext,
  busy,
}: {
  onBack: () => void;
  onNext: (v: { theme: Theme; palette: Palette }) => Promise<void> | void;
  busy: boolean;
}) {
  const t = useTranslations("onboarding");
  const tAppearance = useTranslations("settings.appearance");

  const { data, loading } = useQuery(NOTIFICATION_SETTINGS_QUERY, {
    fetchPolicy: "cache-first",
  });

  const persistedTheme = (data?.notificationSettings?.theme as string | undefined) ?? null;
  const persistedPalette =
    (data?.notificationSettings?.palette as string | undefined) ?? null;

  const [theme, setTheme] = useState<Theme>(ONBOARDING_DEFAULT_THEME);
  const [palette, setPalette] = useState<Palette>(ONBOARDING_DEFAULT_PALETTE);
  const [hydrated, setHydrated] = useState(false);

  // Apply saved values if present, else the onboarding defaults (light +
  // midnight). The hydration guard prevents a race where the query
  // resolves after the user has already clicked through and we overwrite
  // their selection.
  useEffect(() => {
    if (loading || hydrated) return;
    const nextTheme = isTheme(persistedTheme) ? persistedTheme : ONBOARDING_DEFAULT_THEME;
    const nextPalette = isPalette(persistedPalette)
      ? persistedPalette
      : ONBOARDING_DEFAULT_PALETTE;
    setTheme(nextTheme);
    setPalette(nextPalette);
    applyThemeAttribute(nextTheme);
    document.documentElement.dataset.palette = nextPalette;
    setHydrated(true);
  }, [loading, hydrated, persistedTheme, persistedPalette]);

  const onChangeTheme = (next: Theme) => {
    setTheme(next);
    applyThemeAttribute(next);
  };

  const onChangePalette = (next: Palette) => {
    setPalette(next);
    document.documentElement.dataset.palette = next;
  };

  const handleNext = async () => {
    await onNext({ theme, palette });
  };

  const effectiveTheme = detectEffectiveTheme(theme);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-text">
          {t("step2.heading")}
        </h1>
        <p className="text-text-muted text-sm mt-2">{t("step2.sub")}</p>
      </div>

      {/* Mode */}
      <div>
        <div className="text-xs text-text-muted mb-2">{t("step2.mode")}</div>
        <div className="inline-flex flex-wrap gap-1 bg-bg p-1 rounded-lg border border-border">
          {SUPPORTED_THEMES.map((th) => (
            <button
              key={th}
              type="button"
              onClick={() => onChangeTheme(th)}
              disabled={busy}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                theme === th
                  ? "bg-border text-text"
                  : "text-text-muted hover:text-text"
              } disabled:opacity-60`}
            >
              {tAppearance(THEME_LABEL_KEY[th])}
            </button>
          ))}
        </div>
      </div>

      {/* Palette */}
      <div>
        <div className="text-xs text-text-muted mb-2">{t("step2.palette")}</div>
        <div className="inline-flex flex-wrap gap-1 bg-bg p-1 rounded-lg border border-border">
          {SUPPORTED_PALETTES.map((p) => {
            const [a, b] = PALETTE_SWATCHES[p][effectiveTheme];
            const selected = palette === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChangePalette(p)}
                disabled={busy}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors inline-flex items-center gap-2 ${
                  selected
                    ? "bg-border text-text"
                    : "text-text-muted hover:text-text"
                } disabled:opacity-60`}
              >
                <span className="inline-flex">
                  <span
                    className="w-3 h-3 rounded-full border border-border"
                    style={{ background: a }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-border -ml-1"
                    style={{ background: b }}
                  />
                </span>
                {tAppearance(PALETTE_LABEL_KEY[p])}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="text-sm text-text-muted hover:text-text disabled:opacity-50"
        >
          {t("back")}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={busy || !hydrated}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {t("next")}
        </button>
      </div>
    </div>
  );
}
