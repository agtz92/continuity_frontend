"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import { NOTIFICATION_SETTINGS_QUERY } from "@/lib/graphql";
import { PALETTE_COOKIE, isPalette } from "@/palette/config";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Once per session, after auth, read the user's persisted palette from
 * NotificationSettings and reconcile it client-side with cookie + DOM.
 *
 * Pure client-side reconcile (same pattern as useThemeSync). No server
 * action / no router.refresh — that combo triggers a revalidatePath
 * cascade that loops Next dev's CSS rebuild.
 */
export function usePaletteSync() {
  const synced = useRef(false);

  const { data } = useQuery(NOTIFICATION_SETTINGS_QUERY, {
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    if (synced.current) return;
    const saved = data?.notificationSettings?.palette as string | undefined;
    if (!isPalette(saved)) return;
    synced.current = true;
    const current = readCookie(PALETTE_COOKIE);
    if (saved === current) return;
    document.cookie = `${PALETTE_COOKIE}=${saved}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.documentElement.dataset.palette = saved;
  }, [data]);
}
