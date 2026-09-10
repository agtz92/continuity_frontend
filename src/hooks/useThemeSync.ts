"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import { NOTIFICATION_SETTINGS_QUERY } from "@/lib/graphql";
import { THEME_COOKIE, normalizeTheme, type Theme } from "@/theme/config";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function applyThemeAttribute(theme: Theme) {
  if (typeof document === "undefined") return;
  const effective =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "carbon"
        : "light"
      : theme;
  document.documentElement.setAttribute("data-theme", effective);
}

/**
 * Once per session, after auth, read the user's persisted theme from
 * NotificationSettings and reconcile it client-side with the cookie + DOM.
 *
 * Pure client-side reconcile: writes the cookie and flips the `<html>`
 * data-theme attribute. No router.refresh / no server action — the cookie
 * will be picked up by the next SSR navigation naturally, and the DOM
 * attribute keeps the current page visually consistent.
 */
export function useThemeSync() {
  const synced = useRef(false);

  const { data } = useQuery(NOTIFICATION_SETTINGS_QUERY, {
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    if (synced.current) return;
    // Normalizar, no validar: un perfil sin migrar trae `continuuit` o `dark`.
    const saved = normalizeTheme(data?.notificationSettings?.theme);
    if (!saved) return;
    synced.current = true;
    const current = readCookie(THEME_COOKIE);
    if (saved === current) return;
    document.cookie = `${THEME_COOKIE}=${saved}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    applyThemeAttribute(saved);
  }, [data]);
}
