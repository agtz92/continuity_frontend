import { describe, it, expect } from "vitest";
import { isOwnEcho, queriesForTables, ECHO_WINDOW_MS } from "./liveTables";
import { NOTIFICATION_SETTINGS_QUERY } from "@/lib/graphql/notifications";
import { QUICK_NOTES_QUERY } from "@/lib/graphql/quick-notes";
import { RECONNECT } from "@/hooks/useLiveInvalidation";

describe("queriesForTables", () => {
  it("una nota rápida solo relanza Quick Notes", () => {
    expect(queriesForTables(new Set(["core_notesection"]))).toEqual([QUICK_NOTES_QUERY]);
  });

  it("preferencias solo relanzan los ajustes", () => {
    expect(
      queriesForTables(new Set(["notifications_notificationsettings"])),
    ).toEqual([NOTIFICATION_SETTINGS_QUERY]);
  });

  it("una tabla del dashboard relanza todo lo montado", () => {
    expect(queriesForTables(new Set(["core_task"]))).toBe("active");
    expect(queriesForTables(new Set(["core_quicknote", "core_task"]))).toBe("active");
  });

  it("una reconexión o una tabla desconocida relanzan todo", () => {
    expect(queriesForTables(new Set([RECONNECT]))).toBe("active");
    expect(queriesForTables(new Set(["tabla_nueva"]))).toBe("active");
    expect(queriesForTables(new Set())).toBe("active");
  });
});

describe("isOwnEcho", () => {
  const now = 1_000_000;

  it("ignora el aviso de una escritura propia reciente en tablas del dashboard", () => {
    expect(isOwnEcho(new Set(["core_task", "core_activity"]), now - 500, now)).toBe(true);
  });

  it("no ignora pasada la ventana", () => {
    expect(isOwnEcho(new Set(["core_task"]), now - ECHO_WINDOW_MS - 1, now)).toBe(false);
  });

  it("no ignora tablas cuyas mutaciones no relanzan el dashboard", () => {
    expect(isOwnEcho(new Set(["core_quicknote"]), now - 100, now)).toBe(false);
    expect(isOwnEcho(new Set(["notifications_notificationsettings"]), now - 100, now)).toBe(false);
  });

  it("no ignora una reconexión", () => {
    expect(isOwnEcho(new Set([RECONNECT]), now - 100, now)).toBe(false);
  });
});
