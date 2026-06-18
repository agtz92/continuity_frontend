import type { ProjectStatus } from "@/lib/types";

/**
 * Project statuses that appear in the daily/Today views and notifications.
 * Manual mirror of the backend `DAILY_VIEW_PROJECT_STATUSES`
 * (core/services/projects.py). Tasks whose parent project is NOT in this set
 * (paused/stalled/killed/archived) are hidden from Today; standalone tasks
 * with no project are always shown.
 */
export const DAILY_VIEW_PROJECT_STATUSES = [
  "active",
  "idea",
  "launched",
] as const satisfies readonly ProjectStatus[];

export function isDailyViewStatus(status: ProjectStatus): boolean {
  return (DAILY_VIEW_PROJECT_STATUSES as readonly ProjectStatus[]).includes(
    status
  );
}
