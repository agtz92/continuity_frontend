"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "./Modal";
import {
  resolveConfirm,
  subscribeConfirm,
  type ConfirmRequest,
} from "@/lib/confirm";

/**
 * Host de las confirmaciones encoladas en `lib/confirm`. Se monta una sola vez
 * en `Providers`, junto al `Toaster`, y reutiliza `Modal` — así la pregunta
 * hereda el tema, y en móvil baja como BottomSheet igual que el resto.
 *
 * Va después de `children` en el árbol para quedar por encima de cualquier
 * modal ya abierto (ambos usan z-50; gana el que se pinta al final).
 */
export function ConfirmDialog() {
  // Traductor raíz: las peticiones traen claves con puntos (p. ej.
  // "modals.project.deleteConfirm"), igual que los toasts.
  const t = useTranslations();
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => subscribeConfirm(setRequest), []);

  useEffect(() => {
    if (!request) return;
    confirmRef.current?.focus();
    // En captura y cortando la propagación: si no, el Escape también cierra el
    // modal de detalle que hay debajo y se pierde el contexto de la pregunta.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      resolveConfirm(request.id, false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [request]);

  if (!request) return null;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const title = t(request.titleKey as any, request.values as any);
  const body = request.bodyKey
    ? t(request.bodyKey as any, request.values as any)
    : null;
  const confirmLabel = t(request.confirmKey as any);
  const cancelLabel = t(request.cancelKey as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const cancel = () => resolveConfirm(request.id, false);

  const confirmClassName =
    request.tone === "danger"
      ? "border border-signal-a50 bg-signal-a12 text-signal hover:bg-signal-a16"
      : "bg-accent text-bg hover:bg-accent-hi";

  return (
    <Modal
      title={title}
      onClose={cancel}
      widthClassName="sm:w-[24rem] sm:min-w-[18rem] sm:max-w-[min(95vw,32rem)]"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            className="px-4 py-2 rounded-md border border-border text-text-3 text-sm transition-colors duration-150 ease-out hover:text-text"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={() => resolveConfirm(request.id, true)}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ease-out ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {body && (
        <p className="text-[15px] leading-[1.6] text-text-2">{body}</p>
      )}
    </Modal>
  );
}
