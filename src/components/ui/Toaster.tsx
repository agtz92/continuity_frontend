"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { subscribeToasts, toast as toastApi, type Toast } from "@/lib/toast";

// Toasts use a solid surface background so text always reads cleanly,
// regardless of what's underneath. The color comes from the border + icon.
/**
 * Toast **invertido**: fondo casi negro en los temas oscuros, navy en el claro
 * (`--toast-bg`). Es lo único del sistema que invierte, y por eso se ve sin
 * necesitar color ni sombra difusa. El tipo se dice con el icono, no con el
 * fondo — solo el error se lleva `--signal`, en el borde y en el icono.
 */
const styles: Record<Toast["kind"], { ring: string; icon: React.ReactNode }> = {
  error: {
    ring: "border-signal bg-toast-bg text-toast-text",
    icon: <AlertCircle size={18} className="text-signal shrink-0 mt-0.5" />,
  },
  success: {
    ring: "border-accent-a55 bg-toast-bg text-toast-text",
    icon: <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />,
  },
  info: {
    ring: "border-line-30 bg-toast-bg text-toast-text",
    icon: <Info size={18} className="text-toast-text shrink-0 mt-0.5 opacity-70" />,
  },
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Root translator: toasts carry dotted keys (e.g. "errors.connectionLost").
  const t = useTranslations();

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  const render = (toast: Toast): string => {
    if (toast.messageKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return t(toast.messageKey as any, toast.values as any);
    }
    return toast.message ?? "";
  };

  return (
    <div
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-[min(92vw,380px)]"
      role="region"
      aria-label={t("common.notificationsAria")}
    >
      {toasts.map((item) => {
        const s = styles[item.kind];
        return (
          <div
            key={item.id}
            role={item.kind === "error" ? "alert" : "status"}
            className={`flex items-start gap-2 rounded-md border px-3 py-2.5 shadow-hard ${s.ring}`}
          >
            {s.icon}
            <div className="flex-1 text-sm leading-snug whitespace-pre-wrap break-words">
              {render(item)}
            </div>
            <button
              onClick={() => toastApi.dismiss(item.id)}
              className="text-text-5 hover:text-text shrink-0"
              aria-label={t("common.dismiss")}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
