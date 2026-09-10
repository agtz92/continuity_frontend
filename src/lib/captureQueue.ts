"use client";

import type { CaptureKind } from "./quickParse";

/**
 * Lo que la captura rápida **no puede perder**: el borrador a medio escribir y
 * lo que ya se envió pero no llegó.
 *
 * Antes, ESC vaciaba el campo y un fallo de red dejaba el modal abierto sin
 * decir nada. En los dos casos el texto se evaporaba, y capturar algo que se
 * evapora es peor que no capturarlo: crees que ya está guardado.
 *
 * Dos cosas viven aquí, las dos en `localStorage`:
 *
 * 1. **El borrador** — lo que hay escrito, por tipo. Sobrevive a ESC, a cerrar
 *    la pestaña y a recargar. Se borra solo cuando se guarda de verdad.
 * 2. **La cola** — capturas que fallaron al enviarse. Cada una lleva su
 *    `token`, que el servidor usa para no duplicar si el reintento llega
 *    después de que la primera petición sí entrara (`Task.client_token`).
 *
 * Todo acceso a `localStorage` va envuelto: en ventana privada o con el
 * almacenamiento bloqueado lanza, y la captura tiene que seguir funcionando —
 * peor, pero funcionando.
 */

const DRAFT_KEY = "continuity:capture-draft";
const QUEUE_KEY = "continuity:capture-queue";

/** Más allá de esto, algo va mal y la cola sería un vertedero, no un buzón. */
const MAX_QUEUED = 25;

export interface CaptureDraft {
  kind: CaptureKind;
  text: string;
  /** Segunda línea: el `why` de una idea o el cuerpo de una nota. */
  extra: string;
}

export interface QueuedCapture extends CaptureDraft {
  id: string;
  /** Idempotencia en el servidor: el mismo token nunca crea dos tareas. */
  token: string;
  createdAt: string;
  attempts: number;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento no hay borrador ni cola, pero capturar sigue yendo.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Igual que arriba: no poder olvidar no debe romper nada.
  }
}

/** `crypto.randomUUID` no existe en contextos no seguros; el fallback basta. */
export function newToken(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// ------------------------------------------------------------------ borrador

export function readDraft(): CaptureDraft | null {
  const draft = readJson<CaptureDraft | null>(DRAFT_KEY, null);
  if (!draft || typeof draft.text !== "string") return null;
  return {
    kind: draft.kind,
    text: draft.text,
    extra: typeof draft.extra === "string" ? draft.extra : "",
  };
}

export function saveDraft(draft: CaptureDraft): void {
  // Un borrador vacío no es un borrador: guardarlo solo consigue que al abrir
  // ⌘K te reciba un campo "restaurado" que no tiene nada dentro.
  if (!draft.text.trim() && !draft.extra.trim()) {
    remove(DRAFT_KEY);
    return;
  }
  writeJson(DRAFT_KEY, draft);
}

export function clearDraft(): void {
  remove(DRAFT_KEY);
}

// ---------------------------------------------------------------------- cola

type Listener = (queue: QueuedCapture[]) => void;
const listeners = new Set<Listener>();

function emit(queue: QueuedCapture[]): void {
  for (const l of listeners) l(queue);
}

export function listQueued(): QueuedCapture[] {
  const queue = readJson<QueuedCapture[]>(QUEUE_KEY, []);
  return Array.isArray(queue) ? queue : [];
}

export function enqueue(entry: Omit<QueuedCapture, "id" | "createdAt" | "attempts">): QueuedCapture {
  const queued: QueuedCapture = {
    ...entry,
    id: newToken(),
    createdAt: new Date().toISOString(),
    attempts: 1,
  };
  // Si la cola desborda se tira **la más vieja**: lo que acabas de escribir es
  // lo que todavía recuerdas y lo que más duele perder.
  const next = [...listQueued(), queued].slice(-MAX_QUEUED);
  writeJson(QUEUE_KEY, next);
  emit(next);
  return queued;
}

export function dequeue(id: string): void {
  const next = listQueued().filter((q) => q.id !== id);
  writeJson(QUEUE_KEY, next);
  emit(next);
}

export function markAttempt(id: string): void {
  const next = listQueued().map((q) =>
    q.id === id ? { ...q, attempts: q.attempts + 1 } : q
  );
  writeJson(QUEUE_KEY, next);
  emit(next);
}

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener);
  listener(listQueued());
  return () => {
    listeners.delete(listener);
  };
}

/** Solo para tests: deja el almacenamiento como estaba al empezar. */
export const __resetCaptureStorageForTests = () => {
  remove(DRAFT_KEY);
  remove(QUEUE_KEY);
  emit([]);
};
