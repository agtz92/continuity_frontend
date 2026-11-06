"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_IDEA,
  DELETE_IDEA,
  PROMOTE_IDEA,
  UPDATE_IDEA,
} from "@/lib/graphql";

import {
  fullRefetchAfter,
  insertAfter,
  removeAfter,
  syncAfter,
} from "@/lib/dashboardSync";

export function useIdeaMutations() {
  const [createIdea] = useMutation(CREATE_IDEA, insertAfter("ideas", "createIdea"));
  const [updateIdeaM] = useMutation(UPDATE_IDEA, syncAfter);
  const [deleteIdeaM] = useMutation(DELETE_IDEA, removeAfter("ideas"));
  const [promoteIdeaM] = useMutation(PROMOTE_IDEA, fullRefetchAfter);

  const saveIdea = async (i: {
    id?: string;
    title: string;
    description: string;
    why: string;
  }): Promise<boolean> => {
    const data = {
      title: i.title,
      description: i.description,
      why: i.why,
    };
    try {
      if (i.id) {
        await updateIdeaM({ variables: { id: i.id, data } });
      } else {
        await createIdea({ variables: { data } });
      }
      return true;
    } catch {
      return false;
    }
  };

  const deleteIdea = async (id: string): Promise<void> => {
    try {
      await deleteIdeaM({ variables: { id } });
    } catch {
      /* errorLink already toasted */
    }
  };

  /**
   * Promover una idea a proyecto. `firstAction` es obligatoria **en la web**
   * (la exige `PromoteIdeaModal`); el servidor la acepta opcional para no
   * romper la app nativa, que todavía manda solo el id.
   */
  const promoteIdea = async (
    id: string,
    extra?: {
      firstAction?: string;
      categoryId?: string | null;
      priority?: string | null;
    }
  ): Promise<boolean> => {
    try {
      await promoteIdeaM({
        variables: {
          id,
          firstAction: extra?.firstAction ?? null,
          categoryId: extra?.categoryId ?? null,
          priority: extra?.priority ?? null,
        },
      });
      return true;
    } catch {
      /* errorLink already toasted */
      return false;
    }
  };

  return {
    saveIdea,
    deleteIdea,
    promoteIdea,
    raw: { createIdea, deleteIdea: deleteIdeaM },
  };
}
