"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import { NOTIFICATION_SETTINGS_QUERY } from "@/lib/graphql";
import { PALETTE_COOKIE, normalizePalette } from "@/palette/config";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Read the user's persisted palette from NotificationSettings and reconcile it
 * client-side with cookie + DOM — on load and on every change of the query
 * (the live signal refetches it when another tab or device saves a palette).
 *
 * Pure client-side reconcile (same pattern as useThemeSync). No server
 * action / no router.refresh — that combo triggers a revalidatePath
 * cascade that loops Next dev's CSS rebuild.
 */
export function usePaletteSync() {
  const lastApplied = useRef<string | null>(null);

  const { data } = useQuery(NOTIFICATION_SETTINGS_QUERY, {
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    // Normalizar, no validar: un perfil sin migrar trae una de las 8 paletas
    // retiradas, que se pinta con su equivalente curada.
    const saved = normalizePalette(data?.notificationSettings?.palette);
    if (!saved || saved === lastApplied.current) return;
    lastApplied.current = saved;
    // Cookie compartida entre pestañas (ver useThemeSync): se pinta siempre.
    if (readCookie(PALETTE_COOKIE) !== saved) {
      document.cookie = `${PALETTE_COOKIE}=${saved}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    }
    document.documentElement.dataset.palette = saved;
  }, [data]);
}
