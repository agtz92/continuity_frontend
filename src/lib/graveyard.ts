import type { Project, Task } from "@/lib/types";
import { daysSince } from "@/lib/date";

/**
 * De qué murió un proyecto.
 *
 * **No es un dato**: `died_of` no existe en el modelo y no lo he inventado como
 * campo. Se deriva de lo que sí quedó registrado cuando el proyecto se cerró.
 *
 * El orden de las reglas es la decisión de fondo. Casi todos los proyectos
 * muertos tienen `killedReason`, porque el ritual de cierre lo pide — si
 * "cerrado a propósito" fuese lo primero, la columna diría lo mismo siempre y
 * no serviría para nada. Así que **las causas diagnosticables van delante** y
 * "a propósito" queda como lo que es: lo que dijiste tú cuando no hay un patrón
 * que contar.
 */
export type CauseOfDeath = "blocked" | "noFirstAction" | "deliberate" | "faded";

export function causeOfDeath(project: Project, tasks: Task[]): CauseOfDeath {
  const own = tasks.filter((t) => t.projectId === project.id);

  // 1. Murió atorado: se quedó con bloqueos sin resolver.
  if (own.some((t) => !t.done && (t.blockers?.length ?? 0) > 0)) {
    return "blocked";
  }

  // 2. Nunca arrancó: sin siguiente paso y sin ninguna tarea cerrada.
  if (!project.nextStep.trim() && own.every((t) => !t.done)) {
    return "noFirstAction";
  }

  // 3. Lo cerraste y escribiste por qué.
  if ((project.killedReason ?? "").trim()) return "deliberate";

  // 4. Se apagó sin que nadie dijera nada.
  return "faded";
}

/** Días que vivió: de creado a muerto, o a hoy si no consta la fecha. */
export function lifespanDays(project: Project): number {
  if (project.killedAt) {
    const born = new Date(project.created).getTime();
    const died = new Date(project.killedAt).getTime();
    return Math.max(0, Math.round((died - born) / 86_400_000));
  }
  return daysSince(project.created) ?? 0;
}

/**
 * Vida media de los proyectos muertos. Es la única cifra del panel de autopsia
 * que se calcula de verdad — las otras dos que pide el diseño ("17 días entre
 * el blocker y la muerte", "2.1 updates antes de rendirse") necesitan datos que
 * el backend no guarda (ver REDISENO_DECISIONES.md, D-57).
 */
export function averageLifespan(killed: Project[]): number {
  if (killed.length === 0) return 0;
  const total = killed.reduce((sum, p) => sum + lifespanDays(p), 0);
  return Math.round(total / killed.length);
}

/** La causa más repetida, si hay alguna que destaque. */
export function dominantCause(
  killed: Project[],
  tasks: Task[]
): { cause: CauseOfDeath; count: number } | null {
  if (killed.length === 0) return null;
  const tally = new Map<CauseOfDeath, number>();
  for (const p of killed) {
    const c = causeOfDeath(p, tasks);
    tally.set(c, (tally.get(c) ?? 0) + 1);
  }
  let best: { cause: CauseOfDeath; count: number } | null = null;
  for (const [cause, count] of tally) {
    if (!best || count > best.count) best = { cause, count };
  }
  // Una causa que solo aparece una vez no es un patrón, es una anécdota.
  return best && best.count > 1 ? best : null;
}
