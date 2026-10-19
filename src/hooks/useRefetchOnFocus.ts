"use client";

import { useEffect, useRef } from "react";

/**
 * Vuelve a pedir datos cuando el usuario regresa a la pestaña.
 *
 * Una pestaña abierta no se entera de lo que escriben el móvil, Claude (MCP),
 * los syncs o los jobs: Apollo solo consulta al montar y tras las mutaciones
 * propias. Volver a la pestaña es el momento en que más se nota, así que ahí
 * relanzamos la consulta (`visibilitychange`, `focus` y `online`).
 *
 * `minGapMs` evita ráfagas: `focus` y `visibilitychange` suelen dispararse
 * juntos, y alt-tab repetido no debe golpear el backend en cada cambio.
 *
 * `pollMs` (opcional) añade un intervalo que solo corre con la pestaña
 * visible. Para queries de Apollo es mejor `pollInterval` + `skipPollAttempt`;
 * esto es para quien no tiene una sola query a la que colgarlo (AdminShell).
 */
export function useRefetchOnFocus(
  refetch: () => unknown,
  {
    minGapMs = 15_000,
    pollMs,
    enabled = true,
  }: { minGapMs?: number; pollMs?: number; enabled?: boolean } = {},
) {
  // Guardar la función en una ref deja que el caller pase un arrow nuevo en
  // cada render sin re-suscribir los listeners.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    const run = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - last < minGapMs) return;
      last = Date.now();
      void refetchRef.current();
    };

    document.addEventListener("visibilitychange", run);
    window.addEventListener("focus", run);
    window.addEventListener("online", run);
    const timer = pollMs ? window.setInterval(run, pollMs) : undefined;

    return () => {
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("focus", run);
      window.removeEventListener("online", run);
      if (timer) window.clearInterval(timer);
    };
  }, [minGapMs, pollMs, enabled]);
}

/** `skipPollAttempt` para Apollo: no gastar requests con la pestaña oculta. */
export const skipWhenHidden = () =>
  typeof document !== "undefined" && document.hidden;
