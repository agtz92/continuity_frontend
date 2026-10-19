"use client";

import { useEffect, useState } from "react";
import { todayLocalISODate } from "@/lib/date";

/**
 * Fecha local de hoy (`YYYY-MM-DD`) que cambia sola al pasar la medianoche.
 *
 * Las vistas calculan "hoy" con `todayLocalISODate()` durante el render, y
 * varias lo hacen dentro de `useMemo` con dependencias de datos. Con la pestaña
 * abierta de un día para otro nada vuelve a renderizar, así que Today seguía
 * mostrando el día anterior hasta recargar. Quien use esta clave como `key`
 * fuerza el recálculo.
 *
 * Además del timer a la medianoche se revisa al volver a la pestaña: un equipo
 * suspendido no dispara el `setTimeout` a tiempo.
 */
export function useDayKey(): string {
  const [day, setDay] = useState(todayLocalISODate);

  useEffect(() => {
    const sync = () => setDay(todayLocalISODate());

    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      1,
    );
    const timer = window.setTimeout(sync, nextMidnight.getTime() - now.getTime());

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
    // Re-armar el timer cada vez que cambia el día.
  }, [day]);

  return day;
}
