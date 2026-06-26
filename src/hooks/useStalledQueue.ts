import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";

/**
 * Cola de proyectos que el backend marcó como "stalled", para mostrarlos de a
 * uno al cargar el tablero. Extraído de Dashboard (ver AUDITORIA_CODIGO.md).
 *
 * Los ids descartados se recuerdan durante la sesión para que la cola no se
 * reabra. Solo se expone la cabeza de la cola (`currentStalled`); al descartarla
 * el siguiente sube.
 *
 * @param projects Lista actual de proyectos (del dashboard).
 * @returns `currentStalled` (proyecto a atender, o null) y `dismissStalled(id)`.
 */
export function useStalledQueue(projects: Project[]) {
  const [stalledHandled, setStalledHandled] = useState<Set<string>>(new Set());
  const stalledQueue = useMemo(
    () =>
      projects.filter(
        (p) => p.status === "stalled" && !stalledHandled.has(p.id)
      ),
    [projects, stalledHandled]
  );
  const currentStalled = stalledQueue[0] ?? null;
  const dismissStalled = (id: string) =>
    setStalledHandled((prev) => new Set(prev).add(id));
  return { currentStalled, dismissStalled };
}
