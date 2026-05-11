"use client";

import { useState, useTransition } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import {
  NOTIFICATION_SETTINGS_QUERY,
  UPDATE_NOTIFICATION_SETTINGS,
} from "@/lib/graphql";
import { setLocale as setLocaleAction } from "@/i18n/actions";
import {
  LOCALE_COOKIE,
  LOCALE_LABEL,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/i18n/config";
import { toast } from "@/lib/toast";

/**
 * Language selector. Updates both the user's persisted preference (via the
 * GraphQL mutation) and the NEXT_LOCALE cookie (via a server action), then
 * forces a router refresh so server components re-render with the new
 * messages.
 */
export function LanguageSelector() {
  const t = useTranslations("settings.appearance");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const activeLocale = useLocale();

  const { data } = useQuery(NOTIFICATION_SETTINGS_QUERY, {
    fetchPolicy: "cache-first",
  });
  const persisted = (data?.notificationSettings?.locale as Locale | undefined) ?? null;

  // Write the mutation response into the NOTIFICATION_SETTINGS_QUERY cache.
  // Without this, useLocaleSync reads a stale locale from Apollo on the next
  // page mount, sees it differs from the active locale, and "syncs" by
  // reverting — undoing the user's choice. NotificationSettings has no `id`,
  // so Apollo can't auto-normalize the mutation response.
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
  const [savingValue, setSavingValue] = useState<Locale | null>(null);

  // Show the in-flight value while saving, otherwise the persisted value, falling
  // back to whatever locale the page is currently rendering.
  const value: Locale =
    savingValue ?? (persisted as Locale | null) ?? (activeLocale as Locale);

  const onChange = (next: Locale) => {
    if (next === value) return;
    setSavingValue(next);
    startTransition(async () => {
      try {
        await updateSettings({ variables: { data: { locale: next } } });
        // Cookie + browser-side fallback so we never end up out of sync if the
        // server action's revalidatePath is slow to pick up.
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        await setLocaleAction(next);
        router.refresh();
        toast.success(tCommon("saved"));
      } catch {
        // Apollo error link surfaces the toast
        setSavingValue(null);
      }
    });
  };

  return (
    <div>
      <div className="text-xs text-text-muted mb-1 flex items-center gap-2">
        {t("language")}
        {pending && <Loader2 size={12} className="animate-spin text-text-muted" />}
      </div>
      <div className="inline-flex gap-1 bg-bg p-1 rounded-lg border border-border">
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            onClick={() => onChange(loc)}
            disabled={pending}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              value === loc
                ? "bg-border text-text"
                : "text-text-muted hover:text-text"
            } disabled:opacity-60`}
          >
            {LOCALE_LABEL[loc]}
          </button>
        ))}
      </div>
      <p className="text-xs text-text-muted mt-2">{t("languageHint")}</p>
    </div>
  );
}
