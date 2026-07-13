"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { subscribeToasts, toast as toastApi, type Toast } from "@/lib/toast";

// Toasts use a solid surface background so text always reads cleanly,
// regardless of what's underneath. The color comes from the border + icon.
const styles: Record<Toast["kind"], { ring: string; icon: React.ReactNode }> = {
  error: {
    ring: "border-red-500/60 bg-red-50 dark:bg-red-950/95 text-red-900 dark:text-red-50",
    icon: <AlertCircle size={18} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />,
  },
  success: {
    ring: "border-[color-mix(in_srgb,var(--accent)_60%,transparent)] bg-surface text-text",
    icon: <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />,
  },
  info: {
    ring: "border-[color-mix(in_srgb,var(--accent-2)_60%,transparent)] bg-surface text-text",
    icon: <Info size={18} className="text-accent-2 shrink-0 mt-0.5" />,
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
      aria-label="Notifications"
    >
      {toasts.map((item) => {
        const s = styles[item.kind];
        return (
          <div
            key={item.id}
            role={item.kind === "error" ? "alert" : "status"}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg ${s.ring}`}
          >
            {s.icon}
            <div className="flex-1 text-sm leading-snug whitespace-pre-wrap break-words">
              {render(item)}
            </div>
            <button
              onClick={() => toastApi.dismiss(item.id)}
              className="text-text-muted/70 hover:text-text shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
