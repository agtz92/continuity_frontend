"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { NOTIFICATION_SETTINGS_QUERY } from "@/lib/graphql";
import { setLocale as setLocaleAction } from "@/i18n/actions";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";

/**
 * Once per session, after auth, read the user's persisted locale from
 * NotificationSettings and sync it to the NEXT_LOCALE cookie if it differs.
 *
 * Runs the auth-required query, so callers must be inside an authenticated
 * page. The hook is a no-op if the user has no saved preference or the
 * preference already matches the active locale.
 */
export function useLocaleSync() {
  const router = useRouter();
  const activeLocale = useLocale();
  const synced = useRef(false);

  const { data } = useQuery(NOTIFICATION_SETTINGS_QUERY, {
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    if (synced.current) return;
    const saved = data?.notificationSettings?.locale as string | undefined;
    if (!isLocale(saved)) return;
    if (saved === activeLocale) {
      synced.current = true;
      return;
    }
    synced.current = true;
    // Update cookie + force a server re-render so messages reload
    setLocaleAction(saved).then(() => {
      // Explicit refresh to ensure the layout re-runs with the new locale
      // (revalidatePath handles cache, refresh handles router state)
      document.cookie = `${LOCALE_COOKIE}=${saved}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      router.refresh();
    });
  }, [data, activeLocale, router]);
}
