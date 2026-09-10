import type { Priority, ProjectStatus } from "@/lib/types";

/**
 * La espina: barra de 3px al borde izquierdo que dice estado y prioridad
 * ANTES de que leas el nombre. Es la firma del sistema — si solo se implementa
 * una cosa nueva del rediseño, es esta.
 *
 * Contrato (REDISENO_PLAN.md §6, con DP-03 y DP-04 resueltos):
 *
 *   atorado   → sólida --signal. GANA a la prioridad y a cualquier estado.
 *   lanzado   → sólida --closed
 *   en pausa  → rayada (3px sí / 3px no), --line-34
 *   muerto    → sólida --line-22, y el título va tachado (`spineStrikesTitle`)
 *   archivado → sólida --line-22, SIN tachar: así se distingue de muerto
 *   idea      → hueca --line-14: presente pero apagada, aún no es un compromiso
 *   activo    → por prioridad: crítica --signal · alta --accent
 *               media --line-34 · baja --line-22
 *
 * `stalled` (14 días sin actividad) NO tiene espina propia: el enfriamiento se
 * lee en el contador de "días sin tocar", no en la barra. Se pinta como activo.
 *
 * "Atorado" no es un estado del modelo — se deriva de tener >=1 tarea con
 * blocker abierto. Hasta que el backend lo mande calculado (B1), quien renderiza
 * pasa `blocked` a mano.
 */

const PRIORITY_FILL: Record<Priority, string> = {
  critical: "var(--signal)",
  high: "var(--accent)",
  medium: "var(--line-34)",
  low: "var(--line-22)",
};

type SpineLook = { fill: string; striped: boolean; hollow: boolean };

function look(status: ProjectStatus, priority: Priority, blocked: boolean): SpineLook {
  if (blocked) return { fill: "var(--signal)", striped: false, hollow: false };
  switch (status) {
    case "launched":
      return { fill: "var(--closed)", striped: false, hollow: false };
    case "paused":
      return { fill: "var(--line-34)", striped: true, hollow: false };
    case "killed":
    case "archived":
      return { fill: "var(--line-22)", striped: false, hollow: false };
    case "idea":
      return { fill: "var(--line-14)", striped: false, hollow: true };
    default:
      return { fill: PRIORITY_FILL[priority], striped: false, hollow: false };
  }
}

/** ¿El título de esta fila va tachado? Solo lo muerto, nunca lo archivado. */
export function spineStrikesTitle(status: ProjectStatus): boolean {
  return status === "killed";
}

export function Spine({
  status,
  priority = "medium",
  blocked = false,
  title,
  className = "",
}: {
  status: ProjectStatus;
  priority?: Priority;
  /** Tiene al menos un blocker abierto. Gana a todo lo demás. */
  blocked?: boolean;
  /** Tooltip para ratón. La lectura accesible del estado vive en la fila
   *  (badge con aria-label), no aquí: la espina es refuerzo visual. */
  title?: string;
  className?: string;
}) {
  const { fill, striped, hollow } = look(status, priority, blocked);

  // Rayada: 3px de tinta, 3px de nada, en vertical. Es la única forma de decir
  // "en pausa" sin depender del color (requisito de accesibilidad §12.2).
  const style = striped
    ? {
        backgroundImage: `repeating-linear-gradient(to bottom, ${fill} 0 3px, transparent 3px 6px)`,
      }
    : hollow
      ? { boxShadow: `inset 0 0 0 1px ${fill}` }
      : { backgroundColor: fill };

  return (
    <span
      aria-hidden="true"
      title={title}
      // Absoluta y a alto completo: la espina mide lo que mide la fila.
      className={`absolute left-0 top-0 bottom-0 w-[3px] ${className}`}
      style={style}
    />
  );
}
