"use client";

import { useApolloClient, useMutation } from "@apollo/client";
import { useTranslations } from "next-intl";
import {
  DASHBOARD_QUERY,
  MARK_BACKUP,
  MY_DATA_EXPORT,
  RESTORE_BACKUP,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";
import { daysSince } from "@/lib/date";

// Secciones que el servidor sabe restaurar. Del export completo solo se mandan
// estas (sin conversaciones ni ajustes) para no subir de más.
const RESTORABLE = [
  "categories",
  "projects",
  "project_notes",
  "tasks",
  "task_blockers",
  "routines",
  "routine_occurrences",
  "ideas",
  "quick_notes",
  "quick_note_sections",
  "activity",
];

// Debajo del DATA_UPLOAD_MAX_MEMORY_SIZE del backend (10 MB).
const MAX_UPLOAD_BYTES = 9 * 1024 * 1024;

/**
 * Respaldo = el mismo JSON de "Descargar mis datos" (`myDataExport`), que ya
 * lleva todo lo del usuario. Restaurar es UNA mutation que el servidor aplica
 * en una transacción: antes eran cientos de mutations desde el navegador que
 * chocaban con el rate limit y podían dejar la cuenta a medias.
 * Los respaldos viejos del cliente (camelCase) los convierte el backend.
 */
export function useBackup({
  lastBackup,
  refetch,
}: {
  lastBackup: string | null;
  refetch: () => Promise<unknown>;
}) {
  const t = useTranslations("modals.backup.toast");
  const client = useApolloClient();
  const [markBackupM] = useMutation(MARK_BACKUP, {
    refetchQueries: [{ query: DASHBOARD_QUERY }],
  });
  const [restoreM] = useMutation(RESTORE_BACKUP);

  const daysSinceBackup = lastBackup ? daysSince(lastBackup) : null;
  const backupOverdue =
    !lastBackup || (daysSinceBackup !== null && daysSinceBackup >= 7);

  const exportData = async () => {
    let json: string;
    try {
      const { data } = await client.query<{ myDataExport: string }>({
        query: MY_DATA_EXPORT,
        fetchPolicy: "no-cache",
      });
      json = data.myDataExport;
    } catch {
      return; // errorLink ya mostró el error
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `continuity-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    try {
      await markBackupM();
      toast.success(t("exported"));
    } catch {
      // markBackup falló pero el archivo ya se descargó — no presumir éxito
    }
  };

  const importData = async (file: File, mode: "merge" | "replace") => {
    let payload: string;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        toast.error(t("invalidFile"));
        return;
      }
      const obj = parsed as Record<string, unknown>;
      // Export del servidor: solo las secciones restaurables. Formato viejo: tal cual.
      payload = JSON.stringify(
        "exported_at" in obj
          ? Object.fromEntries(RESTORABLE.filter((k) => k in obj).map((k) => [k, obj[k]]))
          : obj
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(t("readError", { message: msg }));
      return;
    }
    if (new Blob([payload]).size > MAX_UPLOAD_BYTES) {
      toast.error(t("tooLarge"));
      return;
    }

    try {
      const { data } = await restoreM({ variables: { data: payload, mode } });
      const r = data?.restoreBackup;
      if (!r) return;
      // Rutinas, Quick Notes y demás viven en otras queries: refrescar todo lo montado.
      await Promise.all([refetch(), client.refetchQueries({ include: "active" })]);
      toast.success(
        t("imported", {
          projects: r.projects,
          tasks: r.tasks,
          routines: r.routines,
          ideas: r.ideas,
          quickNotes: r.quickNotes,
          activity: r.activity,
        })
      );
    } catch {
      // errorLink ya mostró el error (archivo inválido, cupo del plan…).
      // El servidor no escribió nada: la transacción se revirtió.
    }
  };

  return {
    exportData,
    importData,
    daysSinceBackup,
    backupOverdue,
  };
}
