export type ToastKind = "error" | "success" | "info";

export type ToastValues = Record<string, string | number>;

/**
 * Un botón dentro del toast. Existe por "Deshacer": la captura rápida guarda y
 * cierra en una tecla, así que el único momento en el que se puede rectificar
 * es el toast. Sin botón, deshacer significaba ir a buscar la tarea y borrarla.
 */
export type ToastAction = {
  /** Clave i18n del rótulo (los toasts no llevan copy escrito a mano). */
  labelKey: string;
  run: () => void | Promise<void>;
  /** Por defecto el toast se cierra al pulsar; `true` lo deja abierto. */
  keepOpen?: boolean;
};

export type Toast = {
  id: number;
  kind: ToastKind;
  /**
   * Pre-formatted, already-localized (or locale-agnostic) text. Used when the
   * caller has the final string in hand — e.g. a server-provided message.
   */
  message?: string;
  /**
   * An i18n message key (dotted path from the root, e.g. `errors.connectionLost`)
   * resolved by the `Toaster` at render time. Preferred for any client-owned
   * copy so it follows the active locale. Takes precedence over `message`.
   */
  messageKey?: string;
  /** ICU values interpolated into `messageKey`. */
  values?: ToastValues;
  /** Acciones opcionales, renderizadas como botones a la derecha del texto. */
  actions?: ToastAction[];
};

type ToastEntry = Pick<Toast, "message" | "messageKey" | "values" | "actions">;

type Listener = (toasts: Toast[]) => void;

const listeners = new Set<Listener>();
let toasts: Toast[] = [];
let nextId = 0;
const DEFAULT_TTL_MS = 6000;
const ACTION_TTL_MS = 12000;

const emit = () => {
  for (const l of listeners) l(toasts);
};

const push = (kind: ToastKind, entry: ToastEntry, ttl = DEFAULT_TTL_MS) => {
  const id = ++nextId;
  toasts = [...toasts, { id, kind, ...entry }];
  emit();
  if (ttl > 0 && typeof window !== "undefined") {
    window.setTimeout(() => dismiss(id), ttl);
  }
  return id;
};

const dismiss = (id: number) => {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
};

export const toast = {
  error: (message: string, ttl?: number) => push("error", { message }, ttl),
  success: (message: string, ttl?: number) => push("success", { message }, ttl),
  info: (message: string, ttl?: number) => push("info", { message }, ttl),
  /** Localized variants: pass an i18n key (+ optional ICU values). */
  errorKey: (messageKey: string, values?: ToastValues, ttl?: number) =>
    push("error", { messageKey, values }, ttl),
  successKey: (messageKey: string, values?: ToastValues, ttl?: number) =>
    push("success", { messageKey, values }, ttl),
  infoKey: (messageKey: string, values?: ToastValues, ttl?: number) =>
    push("info", { messageKey, values }, ttl),
  /**
   * Toast con botones. El TTL por defecto es más largo que el normal: si el
   * toast es la única vía para deshacer, seis segundos son pocos para leer,
   * decidir y llegar con el ratón.
   */
  withActions: (
    kind: ToastKind,
    entry: ToastEntry,
    actions: ToastAction[],
    ttl = ACTION_TTL_MS
  ) => push(kind, { ...entry, actions }, ttl),
  dismiss,
};

export const subscribeToasts = (listener: Listener) => {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Test-only helper. Resets the module-level state so each test starts
 * from a clean slate. Not exported on the public surface — call from
 * test setup files only.
 */
export const __resetToastsForTests = () => {
  toasts = [];
  nextId = 0;
  emit();
};
