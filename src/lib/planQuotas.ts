/**
 * Client-side mirror of the backend ENTITY_QUOTAS["projects"] cap so the UI can
 * show "X / Y active" without an extra round-trip. Keep in sync with the backend
 * quota config. `null` means unlimited (studio / admin).
 */
export type Plan = "free" | "pro" | "studio" | "admin";

const PROJECT_CAP: Record<Plan, number | null> = {
  free: 3,
  pro: 25,
  studio: null,
  admin: null,
};

/** Project cap for a plan, or null when unlimited. */
export function projectCapForPlan(plan: Plan): number | null {
  return PROJECT_CAP[plan];
}

/**
 * Statuses that count against the project cap. Mirrors the backend: killed and
 * archived projects do not count.
 */
const COUNTING_STATUSES = new Set([
  "idea",
  "active",
  "stalled",
  "paused",
  "launched",
]);

export function countsTowardCap(status: string): boolean {
  return COUNTING_STATUSES.has(status);
}
