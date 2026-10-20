import type { DocumentNode } from "graphql";
import { NOTIFICATION_SETTINGS_QUERY } from "@/lib/graphql/notifications";
import { QUICK_NOTES_QUERY } from "@/lib/graphql/quick-notes";
import { RECONNECT } from "@/hooks/useLiveInvalidation";

/**
 * Qué queries relanzar según las tablas de un aviso en vivo (Fase 2).
 *
 * Antes, cualquier aviso relanzaba todas las queries activas, dashboard
 * incluido (la más pesada). Las tablas que solo pintan una query propia se
 * resuelven aquí con esa query; todo lo demás —o un aviso sin tabla, o una
 * reconexión— sigue relanzando todo, que es lo seguro.
 *
 * Si una vista nueva lee una tabla que aquí se mapea a una query concreta,
 * agrega su query a esa entrada o quita la entrada: un mapeo incompleto deja
 * datos viejos sin avisar.
 */
const NARROW: Record<string, DocumentNode[]> = {
  core_quicknote: [QUICK_NOTES_QUERY],
  core_notesection: [QUICK_NOTES_QUERY],
  notifications_notificationsettings: [NOTIFICATION_SETTINGS_QUERY],
};

export function queriesForTables(tables: Set<string>): "active" | DocumentNode[] {
  if (tables.size === 0 || tables.has(RECONNECT)) return "active";
  const out = new Set<DocumentNode>();
  for (const t of tables) {
    const narrow = NARROW[t];
    if (!narrow) return "active";
    narrow.forEach((q) => out.add(q));
  }
  return [...out];
}

/**
 * Tablas cuyo eco se puede ignorar si esta pestaña acaba de escribir: sus
 * mutaciones ya relanzan `DASHBOARD_QUERY` con `refetchQueries`, así que el
 * aviso que provoca la propia escritura pediría lo mismo otra vez.
 */
const DASHBOARD_TABLES = new Set([
  "core_task",
  "core_taskblocker",
  "core_project",
  "core_projectnote",
  "core_idea",
  "core_category",
  "core_routine",
  "core_routineoccurrence",
  "core_activity",
]);

export const ECHO_WINDOW_MS = 1500;

export function isOwnEcho(
  tables: Set<string>,
  lastLocalWrite: number,
  now = Date.now(),
): boolean {
  if (now - lastLocalWrite > ECHO_WINDOW_MS) return false;
  if (tables.size === 0 || tables.has(RECONNECT)) return false;
  for (const t of tables) if (!DASHBOARD_TABLES.has(t)) return false;
  return true;
}
