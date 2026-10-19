"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_TASK,
  DASHBOARD_QUERY,
  DELETE_TASK,
  REORDER_PROJECT_TASKS,
  TOGGLE_TASK,
  UPDATE_TASK,
} from "@/lib/graphql";
import type { Task } from "@/lib/types";

const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

export function useTaskMutations() {
  const [createTask] = useMutation(CREATE_TASK, refetchAfter);
  const [updateTask] = useMutation(UPDATE_TASK, refetchAfter);
  const [toggleTaskM] = useMutation(TOGGLE_TASK, refetchAfter);
  const [deleteTaskM] = useMutation(DELETE_TASK, refetchAfter);
  // Sin refetch: la respuesta trae id+position y Apollo la funde en la caché.
  const [reorderProjectTasksM] = useMutation(REORDER_PROJECT_TASKS);

  const saveTask = async (t: {
    id?: string;
    title: string;
    projectId: string | null;
    dueDate: string | null;
    done: boolean;
    effortHours: number | null;
    dueTime?: string | null;
    durationMinutes?: number | null;
  }): Promise<boolean> => {
    const data = {
      title: t.title,
      projectId: t.projectId,
      dueDate: t.dueDate,
      done: t.done,
      effortHours: t.effortHours,
      dueTime: t.dueTime ?? null,
      durationMinutes: t.durationMinutes ?? null,
    };
    try {
      if (t.id) {
        await updateTask({ variables: { id: t.id, data } });
      } else {
        await createTask({ variables: { data } });
      }
      return true;
    } catch {
      return false;
    }
  };

  const toggleTask = async (t: Task): Promise<void> => {
    try {
      await toggleTaskM({ variables: { id: t.id } });
    } catch {
      /* errorLink already toasted */
    }
  };

  /** Persiste el orden manual de las tareas de un proyecto. `orderedIds` son
   * las pendientes en su nuevo orden; la respuesta optimista fija `position`
   * para que el arrastre se quede quieto al soltar. */
  const reorderProjectTasks = async (
    projectId: string,
    orderedIds: string[]
  ): Promise<boolean> => {
    try {
      await reorderProjectTasksM({
        variables: { projectId, orderedIds },
        optimisticResponse: {
          reorderProjectTasks: orderedIds.map((id, idx) => ({
            __typename: "Task",
            id,
            position: idx,
          })),
        },
      });
      return true;
    } catch {
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    try {
      await deleteTaskM({ variables: { id } });
    } catch {
      /* errorLink already toasted */
    }
  };

  return {
    saveTask,
    toggleTask,
    deleteTask,
    reorderProjectTasks,
    raw: { createTask, deleteTask: deleteTaskM },
  };
}
