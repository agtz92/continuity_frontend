"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import { supabase } from "@/lib/supabase";
import { ME_QUERY } from "@/lib/graphql";

/**
 * Señales en vivo: "algo tuyo cambió, vuelve a pedir el dashboard".
 *
 * Un trigger en Postgres (`notify_user_change`, migración
 * `core/migrations/*_live_change_signals.py`) manda un broadcast al canal
 * privado `user:<uuid>` cada vez que cambia una fila del usuario, venga de
 * donde venga: esta pestaña, el móvil, Claude por MCP, los syncs o los jobs.
 * El aviso no lleva datos (solo tabla y operación); los datos siguen saliendo
 * por GraphQL, así que no hay que replicar permisos en RLS.
 *
 * Si el socket se cae, no pasa nada grave: el refetch al enfocar y el polling
 * de respaldo de `useDashboardData` siguen cubriendo. Al reconectar se pide
 * una vez, por si hubo avisos mientras estaba caído.
 */
const DEBOUNCE_MS = 400;

export function useLiveInvalidation(
  userId: string | null,
  refetch: () => unknown,
) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let wasDown = false;

    // Un restore o el asistente pueden tocar decenas de filas seguidas: se
    // juntan en una sola consulta.
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refetchRef.current(), DEBOUNCE_MS);
    };

    const channel = supabase.channel(`user:${userId}`, {
      config: { private: true },
    });
    channel.on("broadcast", { event: "changed" }, bump);

    // Los canales privados autorizan con el JWT del usuario contra la política
    // de `realtime.messages`; sin token el join se rechaza.
    void supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (wasDown) bump();
          wasDown = false;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          wasDown = true;
        }
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId]);
}

/**
 * Bandera de encendido gradual (`NEXT_PUBLIC_LIVE_UPDATES`):
 * - `off`   → nadie (vuelta atrás sin quitar código).
 * - `admin` → solo cuentas admin (default: paso 3 del encendido).
 * - `all`   → todos (paso 4).
 *
 * Devuelve el `userId` a escuchar, o `null` si para este usuario está apagado.
 */
export function useLiveUpdatesTarget(): string | null {
  const mode = process.env.NEXT_PUBLIC_LIVE_UPDATES ?? "admin";
  const { data } = useQuery<{ me: { userId: string; isAdmin: boolean } | null }>(
    ME_QUERY,
    { skip: mode === "off", fetchPolicy: "cache-first" },
  );
  const me = data?.me;
  if (!me || mode === "off") return null;
  if (mode === "all") return me.userId;
  return me.isAdmin ? me.userId : null;
}
