import { useState } from "react";
import type { Project } from "@/lib/types";

/**
 * Máquina de estados del ciclo de vida de un proyecto (State Closure),
 * extraída de Dashboard (ver AUDITORIA_CODIGO.md).
 *
 * Pausar/matar no son guardados simples: exigen notas de cierre, así que esas
 * transiciones se interceptan y abren el ritual de cierre (`closure`) en vez de
 * guardar directo. Reactivar un proyecto pausado abre un "welcome-back".
 *
 * Es genérico sobre el payload de guardado `T` (el mismo de `saveProject`) para
 * no acoplarse al tipo concreto del modal.
 *
 * @param saveProject Mutación de guardado; devuelve true si tuvo éxito.
 * @param onClosureSaved Callback tras guardar el cierre con éxito (p. ej. cerrar
 *   y limpiar el modal de proyecto, cuyo estado vive en el componente).
 */
export function useProjectLifecycle<
  T extends { id?: string | null; name: string; status?: string | null }
>(saveProject: (args: T) => Promise<boolean>, onClosureSaved: () => void) {
  // Transición de cierre pendiente de notas. `base` lleva el payload completo
  // (con status ya en paused/killed); el modal rellena las notas y recién ahí se
  // llama a saveProject una vez.
  const [closure, setClosure] = useState<{
    mode: "pause" | "kill";
    projectName: string;
    base: T;
  } | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<Project | null>(null);

  /**
   * Guardado central que intercepta las transiciones pause/kill y las enruta al
   * ritual de cierre (requiere notas). Todo lo demás (incluido resume/revive a
   * active/idea) guarda directo. Devuelve true si guardó.
   */
  const requestSaveProject = async (
    args: T,
    prevStatus?: string
  ): Promise<boolean> => {
    const isTransition = args.id && prevStatus && args.status !== prevStatus;
    if (isTransition && args.status === "paused") {
      setClosure({ mode: "pause", projectName: args.name, base: args });
      return false;
    }
    if (isTransition && args.status === "killed") {
      setClosure({ mode: "kill", projectName: args.name, base: args });
      return false;
    }
    return saveProject(args);
  };

  /** Submit del modal de cierre: mezcla las notas en el payload pendiente y guarda. */
  const handleClosureConfirm = async (notes: Partial<T>): Promise<boolean> => {
    if (!closure) return false;
    const ok = await saveProject({ ...closure.base, ...notes });
    if (ok) {
      setClosure(null);
      onClosureSaved();
    }
    return ok;
  };

  return {
    closure,
    setClosure,
    welcomeBack,
    setWelcomeBack,
    requestSaveProject,
    handleClosureConfirm,
  };
}
