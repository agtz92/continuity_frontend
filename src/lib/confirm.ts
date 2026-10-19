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

/**
 * Opciones de `choiceDialog`: además de confirmar, una salida alternativa
 * (p. ej. "Matar" en vez de "Eliminar") y una nota que la explica.
 */
export type ChoiceOptions = ConfirmOptions & {
  /** Rótulo del botón alternativo. Se pinta con el acento y recibe el foco. */
  altKey: string;
  /** Clave i18n de una nota al pie que justifica la alternativa. Opcional. */
  noteKey?: string;
};

/** Respuesta del diálogo: confirmar, la alternativa, o nada (cancelar/Escape). */
export type ConfirmAnswer = "confirm" | "alt" | null;

export type ConfirmRequest = {
  id: number;
  titleKey: string;
  bodyKey?: string;
  values?: ConfirmValues;
  confirmKey: string;
  cancelKey: string;
  tone: ConfirmTone;
  altKey?: string;
  noteKey?: string;
};

type Entry = { request: ConfirmRequest; resolve: (answer: ConfirmAnswer) => void };
type Listener = (request: ConfirmRequest | null) => void;

const listeners = new Set<Listener>();
let queue: Entry[] = [];
let nextId = 0;

const head = (): ConfirmRequest | null => queue[0]?.request ?? null;

const emit = () => {
  const current = head();
  for (const l of listeners) l(current);
};

const enqueue = (
  options: ConfirmOptions & Partial<Pick<ChoiceOptions, "altKey" | "noteKey">>
): Promise<ConfirmAnswer> =>
  new Promise((resolve) => {
    const request: ConfirmRequest = {
      id: ++nextId,
      titleKey: options.titleKey,
      bodyKey: options.bodyKey,
      values: options.values,
      confirmKey: options.confirmKey ?? "common.delete",
      cancelKey: options.cancelKey ?? "common.cancel",
      tone: options.tone ?? "danger",
      altKey: options.altKey,
      noteKey: options.noteKey,
    };
    queue = [...queue, { request, resolve }];
    emit();
  });

/**
 * Pregunta y espera. Resuelve `true` si el usuario confirma y `false` si
 * cancela, cierra o pulsa Escape — así el callsite lee igual que el viejo
 * `if (!confirm(...)) return;`, solo que con `await`.
 *
 * Si ya hay una pregunta abierta la nueva se encola: dos diálogos apilados
 * dejarían al usuario sin saber a qué está respondiendo.
 */
export async function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return (await enqueue(options)) === "confirm";
}

/**
 * Como `confirmDialog`, pero con un segundo camino. Resuelve `"confirm"`,
 * `"alt"` o `null` si el usuario cancela, cierra o pulsa Escape.
 */
export function choiceDialog(options: ChoiceOptions): Promise<ConfirmAnswer> {
  return enqueue(options);
}

/**
 * La responde el host. Ignora ids que ya no están en la cola (doble clic).
 * Acepta booleano por compatibilidad: `true` = confirmar, `false` = cancelar.
 */
export const resolveConfirm = (id: number, answer: ConfirmAnswer | boolean) => {
  const entry = queue.find((e) => e.request.id === id);
  if (!entry) return;
  queue = queue.filter((e) => e.request.id !== id);
  entry.resolve(answer === true ? "confirm" : answer === false ? null : answer);
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
  for (const e of pending) e.resolve(null);
  emit();
};
