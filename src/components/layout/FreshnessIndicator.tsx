"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Meta } from "@/components/ui/Meta";
import { useLiveStatus } from "@/hooks/useLiveInvalidation";
import { getLastDashboardFetch, subscribeDashboardFetch } from "@/lib/apollo";

/**
 * "En vivo" / "Actualizado hace N min" al pie de la barra lateral.
 *
 * Dice si lo que se ve es fresco sin que haya que recargar para comprobarlo:
 * con el canal en vivo conectado, "En vivo"; si se cayó o está apagado, cuánto
 * hace del último dashboard que llegó. La hora exacta va en el `title`.
 * Punto `closed` = en vivo, `signal` = reconectando, tinta apagada = sin canal.
 */
export function FreshnessIndicator({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations("freshness");
  const status = useLiveStatus();
  const last = useSyncExternalStore(
    subscribeDashboardFetch,
    getLastDashboardFetch,
    () => 0,
  );

  // Reloj de 30 s para que "hace N min" avance solo.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => setNow(Date.now()), [last]);

  if (!last) return null;

  const minutes = Math.max(0, Math.floor((now - last) / 60_000));
  const ago = minutes < 1 ? t("justNow") : t("minutesAgo", { minutes });
  const label =
    status === "live"
      ? t("live")
      : status === "down"
        ? t("reconnecting")
        : t("updated", { ago });
  const exact = new Date(last).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dot =
    status === "live"
      ? "bg-closed"
      : status === "down"
        ? "bg-signal"
        : "bg-text-5";

  return (
    <div
      role="status"
      title={t("tooltip", { time: exact })}
      className={`mx-3 mt-3 flex items-center gap-2 ${
        collapsed ? "justify-center" : "px-1"
      }`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <Meta
        variant="dato"
        tone="faint"
        className={collapsed ? "sr-only" : ""}
      >
        {label}
      </Meta>
    </div>
  );
}
