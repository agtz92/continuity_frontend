/**
 * Cola de confirmaciones. Existe para que el borrado no dependa de
 * `window.confirm()`: ese diálogo lo pinta el navegador, ignora el tema y
 * rompe la continuidad visual justo en la acción que más atención pide.
 *
 * Mismo patrón que `toast.ts` — store de módulo + suscripción — para que la
 * pregunta siga viviendo en el hook de mutación (`useProjectMutations`, etc.)
 * y no se filtre a cada callsite como estado local.
 *
 * El host que la renderiza es `<ConfirmDialog />`, montado en `Providers`.
 */

export type ConfirmValues = Record<string, string | number>;

/** `danger` pinta el botón de confirmar con `--signal`; `neutral`, con el acento. */
export type ConfirmTone = "danger" | "neutral";

export type ConfirmOptions = {
  /** Clave i18n de la pregunta (ruta con puntos desde la raíz). */
  titleKey: string;
  /** Clave i18n de la línea secundaria ("no se puede deshacer"). Opcional. */
  bodyKey?: string;
  /** Valores ICU interpolados en `titleKey` / `bodyKey`. */
  values?: ConfirmValues;
  /** Rótulo del botón que confirma. Por defecto `common.delete`. */
  confirmKey?: string;
  /** Rótulo del botón que cancela. Por defecto `common.cancel`. */
  cancelKey?: string;
  tone?: ConfirmTone;
};

export type ConfirmRequest = {
  id: number;
  titleKey: string;
  bodyKey?: string;
  values?: ConfirmValues;
  confirmKey: string;
  cancelKey: string;
  tone: ConfirmTone;
};

type Entry = { request: ConfirmRequest; resolve: (answer: boolean) => void };
type Listener = (request: ConfirmRequest | null) => void;

const listeners = new Set<Listener>();
let queue: Entry[] = [];
let nextId = 0;

const head = (): ConfirmRequest | null => queue[0]?.request ?? null;

const emit = () => {
  const current = head();
  for (const l of listeners) l(current);
};

/**
 * Pregunta y espera. Resuelve `true` si el usuario confirma y `false` si
 * cancela, cierra o pulsa Escape — así el callsite lee igual que el viejo
 * `if (!confirm(...)) return;`, solo que con `await`.
 *
 * Si ya hay una pregunta abierta la nueva se encola: dos diálogos apilados
 * dejarían al usuario sin saber a qué está respondiendo.
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const request: ConfirmRequest = {
      id: ++nextId,
      titleKey: options.titleKey,
      bodyKey: options.bodyKey,
      values: options.values,
      confirmKey: options.confirmKey ?? "common.delete",
      cancelKey: options.cancelKey ?? "common.cancel",
      tone: options.tone ?? "danger",
    };
    queue = [...queue, { request, resolve }];
    emit();
  });
}

/** La responde el host. Ignora ids que ya no están en la cola (doble clic). */
export const resolveConfirm = (id: number, answer: boolean) => {
  const entry = queue.find((e) => e.request.id === id);
  if (!entry) return;
  queue = queue.filter((e) => e.request.id !== id);
  entry.resolve(answer);
  emit();
};

export const subscribeConfirm = (listener: Listener) => {
  listeners.add(listener);
  listener(head());
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Solo para tests. Limpia el estado de módulo respondiendo que no a lo que
 * quedara pendiente, para que ningún `await` se quede colgado entre casos.
 */
export const __resetConfirmForTests = () => {
  const pending = queue;
  queue = [];
  nextId = 0;
  for (const e of pending) e.resolve(false);
  emit();
};
