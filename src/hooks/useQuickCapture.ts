"use client";

import { useCallback, useEffect, useRef } from "react";
import { useApolloClient, useMutation } from "@apollo/client";

import {
  ADD_NOTE,
  CREATE_IDEA,
  CREATE_TASK,
  DASHBOARD_QUERY,
  DELETE_IDEA,
  DELETE_NOTE,
  DELETE_QUICK_NOTE,
  DELETE_TASK,
} from "@/lib/graphql";
import { useQuickNoteMutations } from "@/hooks/useQuickNoteMutations";
import {
  dequeue,
  enqueue,
  listQueued,
  markAttempt,
  type QueuedCapture,
} from "@/lib/captureQueue";
import type { CaptureKind } from "@/lib/quickParse";
import { quickParse } from "@/lib/quickParse";
import type { Project } from "@/lib/types";

const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

export interface CapturePayload {
  kind: CaptureKind;
  title: string;
  projectId: string | null;
  /** `YYYY-MM-DD` local. */
  dueDate: string | null;
  /** `HH:MM`. */
  dueTime: string | null;
  durationMinutes: number | null;
  /** Razón del bloqueo. `""` = ninguno. Solo aplica a tareas. */
  blocker: string;
  /** Segunda línea: `why` de una idea, cuerpo de una nota. */
  extra: string;
  /** Idempotencia: el mismo token nunca crea dos tareas en el servidor. */
  token: string;
  /** La línea tal como se escribió. Es lo que se encola para reintentar. */
  raw: string;
}

/** Lo que se acaba de crear, para poder deshacerlo o abrirlo. */
export interface SavedCapture {
  kind: CaptureKind;
  id: string;
  projectId: string | null;
}

export type SaveOutcome =
  | { status: "saved"; saved: SavedCapture }
  | { status: "queued" }
  | { status: "invalid" };

/**
 * Fecha local a ISO, igual que hace `TaskModal`: medianoche **local**, no UTC.
 * Mandar `"2026-03-15"` a pelo lo interpretaría como UTC y en América la tarea
 * aparecería el día 14.
 */
function localDateToIso(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0).toISOString();
}

/**
 * La escritura de la captura rápida.
 *
 * Vive fuera del componente porque son tres cosas distintas —guardar, deshacer
 * y reintentar lo que falló— y meterlas en el overlay convertía el overlay en
 * el sitio donde se decide qué se graba.
 *
 * **Nada se pierde.** Si la mutación falla, la captura va a una cola en
 * `localStorage` con su token y se reintenta: al recuperar la red, al volver a
 * la pestaña y al abrir la captura otra vez. El token es lo que hace seguro
 * reintentar — si la petición original sí había entrado, el servidor devuelve
 * la misma tarea en vez de crear una copia.
 */
export function useQuickCapture(projects: Project[]) {
  const client = useApolloClient();
  const [createTask] = useMutation(CREATE_TASK, refetchAfter);
  const [createIdea] = useMutation(CREATE_IDEA, refetchAfter);
  const [addNote] = useMutation(ADD_NOTE, refetchAfter);
  const [deleteTask] = useMutation(DELETE_TASK, refetchAfter);
  const [deleteIdea] = useMutation(DELETE_IDEA, refetchAfter);
  const [deleteActivityNote] = useMutation(DELETE_NOTE, refetchAfter);
  const [deleteQuickNote] = useMutation(DELETE_QUICK_NOTE);
  const { createNote, addSection } = useQuickNoteMutations();

  /** Evita que dos disparos del reintento se pisen (foco + online a la vez). */
  const flushing = useRef(false);

  const write = useCallback(
    async (payload: CapturePayload): Promise<SavedCapture> => {
      const { kind, title } = payload;

      if (kind === "task") {
        // Una hora sin día es hoy: es lo que quiere decir "@9:30" a las nueve
        // de la mañana de un martes.
        const date =
          payload.dueDate ??
          (payload.dueTime ? new Date().toISOString().slice(0, 10) : null);
        // Duración y hora van juntas, como en `TaskModal`: un bloque de 30
        // minutos sin hora de inicio no significa nada en el calendario.
        const timed = Boolean(date && payload.dueTime);
        const res = await createTask({
          variables: {
            data: {
              title,
              projectId: payload.projectId,
              dueDate: date ? localDateToIso(date) : null,
              done: false,
              effortHours: null,
              dueTime: timed ? payload.dueTime : null,
              durationMinutes: timed ? payload.durationMinutes : null,
              // Tarea y bloqueo entran en la misma transacción del servidor.
              blocker: payload.blocker || "",
              clientToken: payload.token,
            },
          },
        });
        const id = (res.data as { createTask?: { id?: string } } | null)
          ?.createTask?.id;
        if (!id) throw new Error("createTask returned no id");
        return { kind, id, projectId: payload.projectId };
      }

      if (kind === "idea") {
        const res = await createIdea({
          variables: {
            data: { title, description: "", why: payload.extra.trim() },
          },
        });
        const id = (res.data as { createIdea?: { id?: string } } | null)
          ?.createIdea?.id;
        if (!id) throw new Error("createIdea returned no id");
        return { kind, id, projectId: null };
      }

      if (kind === "note") {
        const note = await createNote({
          title,
          projectId: payload.projectId,
        });
        if (!note) throw new Error("createQuickNote failed");
        const body = payload.extra.trim();
        if (body) {
          // El cuerpo va en una sección: es como se guarda todo lo demás en
          // una Quick Note, y así se puede plegar y reordenar como el resto.
          await addSection(note.id, { heading: "", body });
        }
        return { kind, id: note.id, projectId: payload.projectId };
      }

      const res = await addNote({
        variables: { projectId: payload.projectId, note: title },
      });
      const id = (res.data as { addNote?: { id?: string } } | null)?.addNote?.id;
      if (!id) throw new Error("addNote returned no id");
      return { kind, id, projectId: payload.projectId };
    },
    [addNote, addSection, createIdea, createNote, createTask]
  );

  /**
   * Guarda. Si la red falla, la captura **se encola** y se avisa: el texto no
   * se pierde y el reintento es seguro gracias al token.
   */
  const save = useCallback(
    async (payload: CapturePayload): Promise<SaveOutcome> => {
      if (!payload.title.trim()) return { status: "invalid" };
      // Un update es un renglón en la bitácora de UN proyecto: sin destino no
      // hay dónde escribirlo, así que no se inventa uno.
      if (payload.kind === "update" && !payload.projectId) {
        return { status: "invalid" };
      }

      try {
        const saved = await write(payload);
        return { status: "saved", saved };
      } catch {
        enqueue({
          token: payload.token,
          kind: payload.kind,
          text: serialize(payload),
          extra: payload.extra,
        });
        return { status: "queued" };
      }
    },
    [write]
  );

  /** Deshacer: borra lo que se acaba de crear. */
  const undo = useCallback(
    async (saved: SavedCapture): Promise<boolean> => {
      try {
        if (saved.kind === "task") {
          await deleteTask({ variables: { id: saved.id } });
        } else if (saved.kind === "idea") {
          await deleteIdea({ variables: { id: saved.id } });
        } else if (saved.kind === "note") {
          await deleteQuickNote({ variables: { id: saved.id } });
          await client.refetchQueries({ include: [DASHBOARD_QUERY] });
        } else {
          await deleteActivityNote({ variables: { id: saved.id } });
        }
        return true;
      } catch {
        return false;
      }
    },
    [client, deleteActivityNote, deleteIdea, deleteQuickNote, deleteTask]
  );

  /**
   * Reintenta lo encolado. Se llama al recuperar la red, al volver a la
   * pestaña y al abrir la captura — nunca en bucle: una cola que se reintenta
   * sola cada segundo con el servidor caído es una forma cara de no arreglar
   * nada.
   */
  const flush = useCallback(async (): Promise<number> => {
    if (flushing.current) return 0;
    const pending = listQueued();
    if (pending.length === 0) return 0;

    flushing.current = true;
    let sent = 0;
    try {
      for (const item of pending) {
        const payload = deserialize(item, projects);
        if (!payload) {
          dequeue(item.id);
          continue;
        }
        try {
          await write(payload);
          dequeue(item.id);
          sent++;
        } catch {
          markAttempt(item.id);
          // Si una falla, las siguientes fallarán igual: es la misma red.
          break;
        }
      }
    } finally {
      flushing.current = false;
    }
    return sent;
  }, [projects, write]);

  useEffect(() => {
    const onWake = () => {
      void flush();
    };
    window.addEventListener("online", onWake);
    window.addEventListener("focus", onWake);
    onWake();
    return () => {
      window.removeEventListener("online", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [flush]);

  return { save, undo, flush };
}

/**
 * La cola guarda **la línea original**, no los campos ya resueltos. Así el
 * reintento vuelve a pasar por el parser: si mientras tanto renombraste el
 * proyecto o cambió el día, se resuelve con lo de ahora y no con lo de
 * entonces. Y lo que se puede leer en `localStorage` sigue siendo lo que
 * escribiste, no un objeto ilegible.
 */
function serialize(payload: CapturePayload): string {
  return payload.raw.trim() || payload.title;
}

function deserialize(
  item: QueuedCapture,
  projects: Project[]
): CapturePayload | null {
  const parsed = quickParse(item.text, projects);
  if (!parsed.title.trim()) return null;
  const kind = parsed.kind ?? item.kind;
  if (kind === "update" && !parsed.projectId) return null;

  return {
    kind,
    title: parsed.title,
    projectId: parsed.projectId,
    dueDate: parsed.dueDate,
    dueTime: parsed.dueTime,
    durationMinutes: parsed.durationMinutes,
    blocker: kind === "task" && parsed.blocked ? parsed.blockerReason : "",
    extra: item.extra,
    token: item.token,
    raw: item.text,
  };
}
