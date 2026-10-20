"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useQuery } from "@apollo/client";
import { supabase } from "@/lib/supabase";
import { ME_QUERY } from "@/lib/graphql";

/**
 * Señales en vivo: "algo cambió en estas tablas, vuelve a pedir".
 *
 * Dos canales privados de Supabase Realtime, ambos alimentados por triggers en
 * Postgres que solo mandan `{table, op}` (los datos siguen saliendo por
 * GraphQL, así que no hay que replicar permisos en RLS):
 *
 * - `user:<uuid>` — `notify_user_change` (backend `core/migrations/0036_*` y
 *   `notifications/migrations/0015_*`): cada fila del usuario, venga de donde
 *   venga (esta pestaña, el móvil, Claude por MCP, los syncs, los jobs).
 * - `admin` — `notify_admin_change` (`core/migrations/0037_*`): usuarios,
 *   planes, feedback, eventos de tienda y auditoría. Solo pueden unirse admins.
 *
 * Si el socket se cae no pasa nada grave: el refetch al enfocar y el polling de
 * respaldo siguen cubriendo. Al reconectar se avisa una vez con `RECONNECT`, por
 * si hubo cambios mientras estaba caído.
 */
const DEBOUNCE_MS = 400;

/** Marcador que se entrega al reconectar: "pudo cambiar cualquier cosa". */
export const RECONNECT = "*";

export type LiveStatus = "off" | "connecting" | "live" | "down";

// Estado de conexión compartido para el indicador del dashboard. Un solo valor
// global basta: en una pestaña hay como mucho un canal por topic.
let status: LiveStatus = "off";
const statusListeners = new Set<() => void>();
function setStatus(next: LiveStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((fn) => fn());
}
export function useLiveStatus(): LiveStatus {
  return useSyncExternalStore(
    (fn) => {
      statusListeners.add(fn);
      return () => statusListeners.delete(fn);
    },
    () => status,
    () => "off",
  );
}

/**
 * Escucha un canal privado y llama `onChange` con las tablas que cambiaron,
 * agrupando ráfagas (un restore o el asistente tocan decenas de filas).
 * `topic = null` lo apaga.
 */
export function useLiveChannel(
  topic: string | null,
  onChange: (tables: Set<string>) => unknown,
  { trackStatus = false }: { trackStatus?: boolean } = {},
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!topic) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = new Set<string>();
    let cancelled = false;
    let wasDown = false;

    const flush = () => {
      const tables = pending;
      pending = new Set();
      void onChangeRef.current(tables);
    };
    const bump = (table: string) => {
      pending.add(table);
      clearTimeout(timer);
      timer = setTimeout(flush, DEBOUNCE_MS);
    };

    const channel = supabase.channel(topic, { config: { private: true } });
    channel.on("broadcast", { event: "changed" }, (msg) => {
      const table = (msg.payload as { table?: string } | undefined)?.table;
      bump(table ?? RECONNECT);
    });

    if (trackStatus) setStatus("connecting");
    // Los canales privados autorizan con el JWT del usuario contra la política
    // de `realtime.messages`; sin token el join se rechaza.
    void supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel.subscribe((s) => {
        if (s === "SUBSCRIBED") {
          if (wasDown) bump(RECONNECT);
          wasDown = false;
          if (trackStatus) setStatus("live");
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          wasDown = true;
          if (trackStatus && !cancelled) setStatus("down");
        }
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (trackStatus) setStatus("off");
      void supabase.removeChannel(channel);
    };
  }, [topic, trackStatus]);
}

/** Canal `user:<uuid>`; `userId = null` lo apaga. */
export function useLiveInvalidation(
  userId: string | null,
  onChange: (tables: Set<string>) => unknown,
) {
  useLiveChannel(userId ? `user:${userId}` : null, onChange, {
    trackStatus: true,
  });
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

/** Igual que `useLiveUpdatesTarget`, para el canal `admin`. */
export function liveAdminEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_LIVE_UPDATES ?? "admin") !== "off";
}
