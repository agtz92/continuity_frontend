"use client";

import { useMutation } from "@apollo/client";
import {
  ADD_UPDATE,
  DASHBOARD_QUERY,
  DELETE_UPDATE,
  UPDATE_UPDATE,
} from "@/lib/graphql";

const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

export function useUpdateMutations() {
  const [addUpdateM] = useMutation(ADD_UPDATE, refetchAfter);
  const [updateUpdateM] = useMutation(UPDATE_UPDATE, refetchAfter);
  const [deleteUpdateM] = useMutation(DELETE_UPDATE, refetchAfter);

  const addUpdate = async (projectId: string, note: string): Promise<boolean> => {
    try {
      await addUpdateM({ variables: { projectId, note } });
      return true;
    } catch {
      return false;
    }
  };

  const editUpdate = async (id: string, note: string): Promise<boolean> => {
    try {
      await updateUpdateM({ variables: { id, note } });
      return true;
    } catch {
      return false;
    }
  };

  const deleteUpdate = async (id: string): Promise<void> => {
    try {
      await deleteUpdateM({ variables: { id } });
    } catch {
      /* errorLink already toasted */
    }
  };

  return {
    addUpdate,
    editUpdate,
    deleteUpdate,
    raw: { addUpdate: addUpdateM },
  };
}
