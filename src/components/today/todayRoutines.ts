/**
 * Lógica pura de "rutinas de hoy" para `TodayView`.
 *
 * Extraído del componente (ver AUDITORIA_CODIGO.md): calcula qué ocurrencias de
 * rutina deben mostrarse hoy y sus agregados (vencidas/hoy, horas de esfuerzo).
 * Puro y testeable — recibe los datos por parámetro en vez de capturarlos del
 * closure del componente.
 */

import type { Project, Routine, RoutineOccurrence } from "@/lib/types";
import { todayLocalISODate, toLocalISO } from "@/lib/date";
import { completedDatesFor, computeDueDates } from "@/lib/recurrence";
import { isDailyViewStatus } from "@/lib/projectStatus";

export interface TodayRoutineItem {
  routine: Routine;
  scheduledDate: string;
}

/** Días hacia atrás que arrastra rutinas vencidas recientes sin acumular backlog. */
const LOOKBACK_DAYS = 14;

/**
 * Ocurrencias de rutina pendientes a mostrar hoy: combina las fechas debidas
 * (ventana de 14 días hacia atrás) con las ya completadas y deja solo las no
 * hechas. Excluye rutinas archivadas o de un proyecto en estado no-diario
 * (pausado/stalled/killed/archivado), igual que las tareas; las standalone
 * siempre se incluyen. Orden ascendente por fecha.
 */
export function computeTodayRoutineItems(
  routines: Routine[],
  routineOccurrences: RoutineOccurrence[],
  projectById: Map<string, Project>
): TodayRoutineItem[] {
  const today = todayLocalISODate();
  const lookback = new Date();
  lookback.setDate(lookback.getDate() - LOOKBACK_DAYS);
  const backStart = toLocalISO(lookback);
  const items: TodayRoutineItem[] = [];
  for (const r of routines) {
    if (r.archived) continue;
    if (r.projectId) {
      const parent = projectById.get(r.projectId);
      if (parent && !isDailyViewStatus(parent.status)) continue;
    }
    const done = completedDatesFor(routineOccurrences, r.id);
    const dates = computeDueDates(r, backStart, today);
    for (const d of dates) {
      if (!done.has(d)) items.push({ routine: r, scheduledDate: d });
    }
  }
  items.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  return items;
}

/** Desglosa los items en vencidos (antes de hoy) vs. de hoy + total. */
export function routineCounts(items: TodayRoutineItem[]): {
  overdue: number;
  dueToday: number;
  total: number;
} {
  const today = todayLocalISODate();
  const overdue = items.filter((it) => it.scheduledDate < today).length;
  const dueToday = items.filter((it) => it.scheduledDate === today).length;
  return { overdue, dueToday, total: overdue + dueToday };
}

/** Suma de horas de esfuerzo de las rutinas pendientes hoy, redondeada a 1 decimal. */
export function routineEffortHours(items: TodayRoutineItem[]): number {
  const sum = items.reduce((acc, it) => acc + (it.routine.effortHours ?? 0), 0);
  return Math.round(sum * 10) / 10;
}
