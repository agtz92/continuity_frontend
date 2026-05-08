"use client";

import { useMutation } from "@apollo/client";
import { ADD_UPDATE, DASHBOARD_QUERY } from "@/lib/graphql";

const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

export function useUpdateMutations() {
  const [addUpdateM] = useMutation(ADD_UPDATE, refetchAfter);

  const addUpdate = async (projectId: string, note: string): Promise<boolean> => {
    try {
      await addUpdateM({ variables: { projectId, note } });
      return true;
    } catch {
      return false;
    }
  };

  return {
    addUpdate,
    raw: { addUpdate: addUpdateM },
  };
}
