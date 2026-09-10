import type { Activity, Project } from "@/lib/types";
import { projectCooling, projectDays, projectIsBlocked } from "@/lib/cooling";

/**
 * Las tres señales con las que abre el Home del rediseño (S01):
 *
 *   1. "Dónde te quedaste" — UN proyecto, el último tocado, con su último
 *      update escrito citado.
 *   2. "Detenido por algo"  — lo que está atorado, lo más viejo primero.
 *   3. "Se están enfriando" — lo que lleva días sin moverse.
 *
 * Todo se deriva de datos que ya viajan en el dashboard. La regla que las une:
 * **el protagonista no se repite abajo**. Si el último proyecto tocado está
 * atorado, su blocker ya se lee en grande en el bloque de arriba; volver a
 * listarlo convierte la pantalla en un eco.
 */

/** Estados que cuentan como "vivo". Pausado y muerto no piden ser retomados. */
const LIVE = new Set(["active", "launched"]);

/**
 * Qué puede "enfriarse". Más estrecho que `LIVE` a propósito:
 *
 * - **`launched` no cuenta.** Un proyecto lanzado no se está apagando, está
 *   terminado. Que lleve 40 días sin tocarse es exactamente lo que se espera.
 *   Los lanzados que aún arrastran tareas ya tienen su propia sección.
 * - **`killed`, `archived`, `paused`, `idea` tampoco**: ninguno es un
 *   compromiso vivo que se esté perdiendo por dejadez.
 * - **`stalled` tampoco**, pero por otro motivo: es enfriamiento ya declarado
 *   en el modelo, y tiene su propio bloque ("estancados"). Contarlo aquí sería
 *   decir dos veces lo mismo.
 */
const CAN_COOL = new Set(["active"]);

export interface ResumeThread {
  project: Project;
  /** El último update escrito a mano. Los eventos del sistema no cuentan. */
  lastNote: Activity | null;
  days: number;
}

/**
 * El proyecto por el que se abre el Home: el último con movimiento real.
 * `null` si no hay ninguno vivo — la sección entonces no se pinta.
 */
export function pickResumeThread(
  projects: Project[],
  activities: Activity[]
): ResumeThread | null {
  const live = projects.filter((p) => LIVE.has(p.status));
  if (live.length === 0) return null;

  const project = live.reduce((best, p) =>
    new Date(p.lastActivity) > new Date(best.lastActivity) ? p : best
  );

  // `note` es el update escrito a mano; el resto de kinds son eventos del
  // sistema y no dicen nada que valga la pena citar.
  let lastNote: Activity | null = null;
  for (const a of activities) {
    if (a.kind !== "note") continue;
    if (a.projectId !== project.id) continue;
    if (!lastNote || new Date(a.created) > new Date(lastNote.created)) {
      lastNote = a;
    }
  }

  return { project, lastNote, days: projectDays(project) };
}

/** Lo atorado, lo que lleva más tiempo primero. Sin el protagonista. */
export function stoppedProjects(
  projects: Project[],
  exceptId?: string
): Project[] {
  return projects
    .filter(
      (p) => LIVE.has(p.status) && p.id !== exceptId && projectIsBlocked(p)
    )
    .sort((a, b) => {
      // Sin `blockedSince` (respuesta vieja) el proyecto va al final: no se
      // puede afirmar que lleve más tiempo parado que uno que sí lo trae.
      if (!a.blockedSince) return 1;
      if (!b.blockedSince) return -1;
      return a.blockedSince.localeCompare(b.blockedSince);
    });
}

export interface CoolingEntry {
  project: Project;
  days: number;
}

/**
 * Lo que se está enfriando: **solo proyectos activos**, fuera del tramo
 * templado, lo más frío primero. Sin el protagonista (acaba de tocarse, por
 * definición no está frío) y sin lo que ya sale como atorado — un proyecto
 * parado por un blocker no es lo mismo que uno abandonado, y mezclarlos borra
 * justo esa diferencia.
 */
export function coolingProjects(
  projects: Project[],
  { exceptId, limit = 3 }: { exceptId?: string; limit?: number } = {}
): CoolingEntry[] {
  return projects
    .filter(
      (p) =>
        CAN_COOL.has(p.status) &&
        p.id !== exceptId &&
        !projectIsBlocked(p) &&
        projectCooling(p) !== "warm"
    )
    .map((p) => ({ project: p, days: projectDays(p) }))
    .sort((a, b) => b.days - a.days)
    .slice(0, limit);
}
