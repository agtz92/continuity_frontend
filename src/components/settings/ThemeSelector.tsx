"use client";

import { useState, useTransition } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import {
  NOTIFICATION_SETTINGS_QUERY,
  UPDATE_NOTIFICATION_SETTINGS,
} from "@/lib/graphql";
import { setTheme as setThemeAction } from "@/theme/actions";
import {
  DEFAULT_THEME,
  SUPPORTED_THEMES,
  THEME_COOKIE,
  THEME_LABEL_KEY,
  normalizeTheme,
  type Theme,
} from "@/theme/config";
import { toast } from "@/lib/toast";
import { ThemeSwatch } from "./ThemeSwatch";

function applyThemeAttribute(theme: Theme) {
  if (typeof document === "undefined") return;
  const effective =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "carbon"
        : "light"
      : theme;
  document.documentElement.dataset.theme = effective;
}

/**
 * Theme selector. Updates both the user's persisted preference (via the
 * GraphQL mutation) and the NEXT_THEME cookie (via a server action), then
 * forces a router refresh so server components re-render. Also flips
 * `data-theme` on <html> immediately for instant visual feedback.
 */
export function ThemeSelector() {
  const t = useTranslations("settings.appearance");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const { data } = useQuery(NOTIFICATION_SETTINGS_QUERY, {
    fetchPolicy: "cache-first",
  });
  // El perfil puede traer un nombre retirado (`continuuit`/`dark`), o venir de
  // la app nativa, que no se migra en este rediseño: se normaliza al leer.
  const persisted = normalizeTheme(data?.notificationSettings?.theme);

  // Sync the mutation response into the query cache so the sync hooks on
  // the next mounted page see the fresh value (NotificationSettings has no
  // `id`, so Apollo can't auto-merge the mutation result on its own).
  const [updateSettings] = useMutation(UPDATE_NOTIFICATION_SETTINGS, {
    update: (cache, { data }) => {
      if (data?.updateNotificationSettings) {
        cache.writeQuery({
          query: NOTIFICATION_SETTINGS_QUERY,
          data: { notificationSettings: data.updateNotificationSettings },
        });
      }
    },
  });
  const [pending, startTransition] = useTransition();
  const [savingValue, setSavingValue] = useState<Theme | null>(null);

  const value: Theme = savingValue ?? persisted ?? DEFAULT_THEME;

  const onChange = (next: Theme) => {
    if (next === value) return;
    setSavingValue(next);
    // Immediate visual feedback while server round-trip happens
    applyThemeAttribute(next);
    startTransition(async () => {
      try {
        await updateSettings({ variables: { data: { theme: next } } });
        document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        await setThemeAction(next);
        router.refresh();
        toast.success(tCommon("saved"));
      } catch {
        setSavingValue(null);
      }
    });
  };

  return (
    <div>
      <div className="text-xs text-text-muted mb-1 flex items-center gap-2">
        {t("theme")}
        {pending && <Loader2 size={12} className="animate-spin text-text-muted" />}
      </div>
      {/* Preview real de cada tema, no solo el nombre: "carbón" y "continuu"
          son dos oscuros distintos y el nombre no los distingue. Los colores
          salen de `tokens.json` vía el generador, así que no pueden divergir
          de lo que se pinta de verdad. */}
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_THEMES.map((theme) => (
          <button
            key={theme}
            onClick={() => onChange(theme)}
            disabled={pending}
            aria-pressed={value === theme}
            className={`flex flex-col items-start gap-1.5 p-1.5 rounded-md border transition-colors duration-150 ease-out disabled:opacity-60 ${
              value === theme
                ? "border-accent bg-accent-a12"
                : "border-border hover:border-line-34"
            }`}
          >
            <ThemeSwatch theme={theme} />
            <span
              className={`px-1 text-xs ${
                value === theme ? "text-text" : "text-text-3"
              }`}
            >
              {t(THEME_LABEL_KEY[theme])}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-text-muted mt-2">{t("themeHint")}</p>
    </div>
  );
}
