"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";

import { DASHBOARD_QUERY, REMOVE_TASK_BLOCKER } from "@/lib/graphql";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import type { Task } from "@/lib/types";
import { daysSince } from "@/lib/date";
import { Modal } from "@/components/ui/Modal";
import { Meta } from "@/components/ui/Meta";
import { BlockerBadge } from "@/components/ui/BlockerBadge";

const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

/**
 * Completar una tarea que sigue bloqueada es incoherente: o el bloqueo se
 * levantó y nadie lo registró, o la tarea dejó de importar. En vez de dejar un
 * blocker abierto colgando de una tarea cerrada, se pregunta cuál de las dos.
 *
 * No hay opción de "cerrarla y dejar el blocker" a propósito: es justo el
 * estado sucio que este diálogo existe para evitar.
 *
 * El diálogo hace él mismo el trabajo de datos (quitar los blockers, o borrar
 * la tarea) y delega el completado en `onResolve`, que es el toggle normal de
 * la fila — así el camino feliz sigue siendo exactamente el de siempre.
 */
export function BlockedTaskDialog({
  task,
  onClose,
  onResolve,
}: {
  task: Task;
  onClose: () => void;
  /** Completar la tarea. Se llama tras retirar los blockers. */
  onResolve: () => void;
}) {
  const t = useTranslations("blockedTaskDialog");
  const tCommon = useTranslations("common");
  const [removeBlocker] = useMutation(REMOVE_TASK_BLOCKER, refetchAfter);
  const { deleteTask } = useTaskMutations();
  const [busy, setBusy] = useState<"resolve" | "delete" | null>(null);

  const reason =
    task.blockedReason ||
    task.blockers.find((b) => b.externalDescription)?.externalDescription;
  const since =
    daysSince(task.blockedSince ?? task.blockers.map((b) => b.created).sort()[0]) ?? 0;

  const handleResolve = async () => {
    setBusy("resolve");
    try {
      // Se retiran todos: la tarea no puede quedar medio desbloqueada.
      for (const b of task.blockers) {
        await removeBlocker({ variables: { id: b.id } });
      }
      onResolve();
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy("delete");
    try {
      await deleteTask(task.id);
      onClose();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      title={t("title")}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleResolve}
            disabled={busy !== null}
            className="w-full px-4 py-2 rounded-md bg-accent text-bg font-medium text-sm transition-colors duration-150 ease-out hover:bg-accent-hi disabled:opacity-60"
          >
            {t("resolve")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            className="w-full px-4 py-2 rounded-md border border-signal-a50 bg-signal-a12 text-signal font-medium text-sm transition-colors duration-150 ease-out hover:bg-signal-a16 disabled:opacity-60"
          >
            {t("delete")}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy !== null}
            className="w-full px-4 py-2 rounded-md border border-border text-text-3 text-sm transition-colors duration-150 ease-out hover:text-text disabled:opacity-60"
          >
            {tCommon("cancel")}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-[15px] leading-[1.6] text-text-2">{task.title}</p>
        <BlockerBadge since={since} reason={reason} />
        <Meta variant="cintillo" tone="faint" className="block">
          {t("hint")}
        </Meta>
      </div>
    </Modal>
  );
}
