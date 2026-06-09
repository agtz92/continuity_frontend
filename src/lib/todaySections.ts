/**
 * Canonical list of Today sections.
 *
 * KEEP IN SYNC with:
 *   - continuity_backend/core/services/preferences.py (TODAY_SECTION_IDS)
 *   - continuity-mobile/src/lib/todaySections.ts
 *
 * The order here is the **default order** shown to a new user.
 * `hideable: false` means the section is always visible — it still
 * participates in the order so the user can move it, but it has no
 * eye-toggle in the customize mode.
 */

export type TodaySectionId =
  | "counters"
  | "stalled-alert"
  | "today-focus"
  | "routines-today"
  | "done-today"
  | "closeable"
  | "sleeping"
  | "stale-ideas"
  | "active-projects"
  | "launched-with-tasks";

export type TodaySectionMeta = {
  id: TodaySectionId;
  /** i18n key under `views.today.sections.<id>` for the customize-mode label. */
  labelKey: string;
  /** False for sections the user cannot hide. */
  hideable: boolean;
};

export const TODAY_SECTIONS: readonly TodaySectionMeta[] = [
  { id: "counters", labelKey: "counters", hideable: true },
  { id: "stalled-alert", labelKey: "stalledAlert", hideable: true },
  { id: "today-focus", labelKey: "todayFocus", hideable: false },
  { id: "routines-today", labelKey: "routinesToday", hideable: true },
  { id: "done-today", labelKey: "doneToday", hideable: true },
  { id: "closeable", labelKey: "closeable", hideable: true },
  { id: "sleeping", labelKey: "sleeping", hideable: true },
  { id: "stale-ideas", labelKey: "staleIdeas", hideable: true },
  { id: "active-projects", labelKey: "activeProjects", hideable: true },
  { id: "launched-with-tasks", labelKey: "launchedWithTasks", hideable: true },
] as const;

export const TODAY_SECTION_IDS: readonly TodaySectionId[] = TODAY_SECTIONS.map(
  (s) => s.id
);

export const NON_HIDEABLE_TODAY_IDS: ReadonlySet<TodaySectionId> = new Set(
  TODAY_SECTIONS.filter((s) => !s.hideable).map((s) => s.id)
);

export function getSectionMeta(id: TodaySectionId): TodaySectionMeta {
  const found = TODAY_SECTIONS.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Unknown today section id: ${id}`);
  }
  return found;
}
