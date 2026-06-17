"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_PROJECT,
  DASHBOARD_QUERY,
  DELETE_PROJECT,
  UPDATE_PROJECT,
} from "@/lib/graphql";
import type { Priority } from "@/lib/types";

const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

export function useProjectMutations() {
  const [createProject] = useMutation(CREATE_PROJECT, refetchAfter);
  const [updateProject] = useMutation(UPDATE_PROJECT, refetchAfter);
  const [deleteProject] = useMutation(DELETE_PROJECT, refetchAfter);

  /** Save (create or update). Returns true on success, false on failure (errorLink already toasted). */
  const saveProject = async (p: {
    id?: string;
    name: string;
    description: string;
    why: string;
    nextStep: string;
    status: string;
    priority: Priority;
    categoryId: string | null;
    dueDate: string | null;
    // Closure notes — sent only when a transition needs them (pause/kill).
    pausedContext?: string;
    pausedNextAction?: string;
    pausedBlocker?: string;
    killedReason?: string;
    killedLearnings?: string;
    killedWouldRestart?: string;
  }): Promise<boolean> => {
    const data = {
      name: p.name,
      description: p.description,
      why: p.why,
      nextStep: p.nextStep,
      status: p.status,
      priority: p.priority,
      categoryId: p.categoryId,
      dueDate: p.dueDate,
      pausedContext: p.pausedContext,
      pausedNextAction: p.pausedNextAction,
      pausedBlocker: p.pausedBlocker,
      killedReason: p.killedReason,
      killedLearnings: p.killedLearnings,
      killedWouldRestart: p.killedWouldRestart,
    };
    try {
      if (p.id) {
        await updateProject({ variables: { id: p.id, data } });
      } else {
        await createProject({ variables: { data } });
      }
      return true;
    } catch {
      return false;
    }
  };

  /** Delete with confirm prompt. Returns true if user confirmed and call succeeded. */
  const deleteProjectWithConfirm = async (id: string): Promise<boolean> => {
    if (!confirm("Delete this project and all its tasks?")) return false;
    try {
      await deleteProject({ variables: { id } });
      return true;
    } catch {
      return false;
    }
  };

  return {
    saveProject,
    deleteProject: deleteProjectWithConfirm,
    /** Raw mutations for cases like backup import that need direct access. */
    raw: { createProject, deleteProject },
  };
}
