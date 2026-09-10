import type { Routine } from "@/lib/types";
import { computeDueDates } from "@/lib/recurrence";
import { toLocalISO } from "@/lib/date";

/**
 * Historia de una rutina, derivada — nunca almacenada.
 *
 * "Saltada" **no es un dato**: `RoutineOccurrence` solo existe si alguien la
 * completó. Una ocurrencia saltada es la *ausencia* de fila en una fecha que la
 * regla de recurrencia sí programaba. Todo lo de aquí se calcula cruzando
 * `computeDueDates` (lo que tocaba) con las ocurrencias reales (lo que se hizo).
 *
 * **Límite real:** el dashboard trae 90 días de ocurrencias
 * (`services/dashboard.py` → `list_recent_occurrences(days=90)`). Mirar más
 * atrás pintaría de "saltado" lo que simplemente no vino en la respuesta, así
 * que la ventana se corta ahí. La racha que sale de aquí es por tanto una cota
 * inferior: puede quedarse corta, nunca inflarse.
 */
export const RULE_WINDOW_DAYS = 90;

/** Cuántos bloques caben en la regla sin dejar de ser contables. */
export const RULE_MAX_BLOCKS = 12;

export type OccurrenceState = "done" | "skipped" | "pending" | "next";

export interface OccurrenceMark {
  date: string;
  state: OccurrenceState;
}

function windowStart(today: string): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() - (RULE_WINDOW_DAYS - 1));
  return toLocalISO(d);
}

/**
 * Los últimos `limit` bloques de la rutina, del más viejo al más nuevo, más la
 * próxima ocurrencia si la hay.
 *
 * - `done`    → hubo ocurrencia
 * - `skipped` → tocaba y no la hubo (fecha ya cerrada)
 * - `pending` → tocaba hoy y aún no está hecha: hoy no se da por saltado
 * - `next`    → la siguiente que toca, aún en el futuro
 */
export function buildOccurrenceRule(
  routine: Routine,
  completed: Set<string>,
  today: string,
  limit: number = RULE_MAX_BLOCKS
): OccurrenceMark[] {
  const past = computeDueDates(routine, windowStart(today), today);
  const marks: OccurrenceMark[] = past.slice(-limit).map((date) => ({
    date,
    state: completed.has(date)
      ? "done"
      : date === today
        ? "pending"
        : "skipped",
  }));

  // La próxima solo se busca si no está archivada: una rutina archivada no
  // vuelve a tocar, aunque la regla siga generando fechas.
  if (!routine.archived) {
    const ahead = new Date(today + "T00:00:00");
    ahead.setDate(ahead.getDate() + 1);
    const from = toLocalISO(ahead);
    const until = new Date(today + "T00:00:00");
    until.setDate(until.getDate() + 365);
    const next = computeDueDates(routine, from, toLocalISO(until)).find(
      (d) => !completed.has(d)
    );
    if (next) marks.push({ date: next, state: "next" });
  }

  return marks;
}

/**
 * Ocurrencias completadas seguidas, contando hacia atrás desde la última fecha
 * ya cerrada. **Hoy no rompe la racha** mientras siga siendo hoy: una rutina
 * que toca hoy y aún no se ha hecho no está saltada, está pendiente.
 *
 * Cota inferior por la ventana de 90 días (ver arriba).
 */
export function currentStreak(
  routine: Routine,
  completed: Set<string>,
  today: string
): number {
  const dates = computeDueDates(routine, windowStart(today), today);
  let streak = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i];
    if (completed.has(d)) {
      streak++;
      continue;
    }
    // Hoy pendiente: se ignora y se sigue contando hacia atrás.
    if (d === today) continue;
    break;
  }
  return streak;
}

/**
 * Una rutina "sin ocurrencias programadas": la regla ya no genera nada por
 * delante. Es lo más cerca que hay de la "pausa" que pide el diseño — el modelo
 * `Routine` no tiene estado de pausa, solo `archived` y `end_date`
 * (ver REDISENO_DECISIONES.md, D-41).
 */
export function hasNoFutureOccurrences(marks: OccurrenceMark[]): boolean {
  return !marks.some((m) => m.state === "next" || m.state === "pending");
}
