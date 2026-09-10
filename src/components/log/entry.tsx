import {
  Calendar,
  CheckCircle2,
  FileText,
  NotebookPen,
  RefreshCw,
  Rocket,
  Sparkles,
  Trash2,
} from "lucide-react";

import type { Activity, ActivityKind } from "@/lib/types";

/**
 * Cómo se lee una entrada del log. Extraído de `views/LogView.tsx` para que la
 * cola del log en el Home (S01) enseñe **exactamente lo mismo** que el diario
 * completo: si la frase o el icono divergen, el usuario ve dos verdades.
 *
 * Los iconos son **metadato neutro**, no un semáforo (DP-05). Antes cada kind
 * traía su color de Tailwind — esmeralda, ámbar, púrpura, cian, azul — y el log
 * se leía como un arcoíris; además los tonos `-400` son pálidos y sobre el tema
 * papel no se veían. Ahora solo hay tres voces: lo que escribiste (acento), lo
 * que se cerró (cerrado) y lo que se borró (señal). El resto es tinta apagada.
 */
export function iconFor(kind: ActivityKind) {
  switch (kind) {
    case "note":
      return <FileText size={14} className="text-accent" />;
    case "task_completed":
    case "routine_completed":
      return <CheckCircle2 size={14} className="text-closed" />;
    case "project_created":
    case "idea_created":
    case "task_created":
    case "routine_created":
      return <Sparkles size={14} className="text-text-4" />;
    case "quick_note_created":
      return <NotebookPen size={14} className="text-accent" />;
    case "idea_promoted":
      return <Rocket size={14} className="text-accent" />;
    case "project_status_changed":
      return <RefreshCw size={14} className="text-text-4" />;
    case "project_due_date_changed":
    case "task_due_date_changed":
      return <Calendar size={14} className="text-text-4" />;
    case "project_deleted":
    case "task_deleted":
    case "idea_deleted":
    case "routine_deleted":
    case "quick_note_deleted":
      return <Trash2 size={14} className="text-signal" />;
    default:
      return <FileText size={14} className="text-text-4" />;
  }
}

export function formatActivityDate(iso: string | null, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type DescribeArgs = {
  activity: Activity;
  locale: string;
  tEntry: (key: string, params?: Record<string, string>) => string;
  tStatus: (key: string) => string;
};

/** Renders an activity into a human-readable, localized line. */
export function describeActivity({
  activity: a,
  locale,
  tEntry,
  tStatus,
}: DescribeArgs): string {
  const title = a.entityTitle || tEntry("untitled");
  switch (a.kind) {
    case "note":
      return a.note;
    case "task_completed":
      return tEntry("taskCompleted", { title });
    case "task_created":
      return tEntry("taskCreated", { title });
    case "task_deleted":
      return tEntry("taskDeleted", { title });
    case "task_due_date_changed":
      return a.newValue
        ? tEntry("taskRescheduled", {
            title,
            date: formatActivityDate(a.newValue, locale),
          })
        : tEntry("taskDueCleared", { title });
    case "project_created":
      return tEntry("projectCreated", { title });
    case "project_deleted":
      return tEntry("projectDeleted", { title });
    case "project_status_changed":
      return tEntry("projectStatusChanged", {
        title,
        previous: a.previousValue ? tStatus(a.previousValue) : "",
        next: a.newValue ? tStatus(a.newValue) : "",
      });
    case "project_due_date_changed":
      return a.newValue
        ? tEntry("projectDueSet", {
            title,
            date: formatActivityDate(a.newValue, locale),
          })
        : tEntry("projectDueCleared", { title });
    case "idea_created":
      return tEntry("ideaCreated", { title });
    case "idea_deleted":
      return tEntry("ideaDeleted", { title });
    case "idea_promoted":
      return tEntry("ideaPromoted", { title });
    case "routine_created":
      return tEntry("routineCreated", { title });
    case "routine_completed":
      return tEntry("routineCompleted", { title });
    case "routine_deleted":
      return tEntry("routineDeleted", { title });
    case "quick_note_created":
      return tEntry("quickNoteCreated", { title });
    case "quick_note_deleted":
      return tEntry("quickNoteDeleted", { title });
    default:
      return a.entityTitle;
  }
}
