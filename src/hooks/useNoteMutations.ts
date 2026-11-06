"use client";

import { useMutation } from "@apollo/client";
import {
  ADD_NOTE,
  DELETE_NOTE,
  UPDATE_NOTE,
} from "@/lib/graphql";

import { insertAfter, removeAfter, syncAfter } from "@/lib/dashboardSync";

export function useNoteMutations() {
  const [addNoteM] = useMutation(ADD_NOTE, insertAfter("activities", "addNote"));
  const [updateNoteM] = useMutation(UPDATE_NOTE, syncAfter);
  const [deleteNoteM] = useMutation(DELETE_NOTE, removeAfter("activities"));

  const addNote = async (projectId: string, note: string): Promise<boolean> => {
    try {
      await addNoteM({ variables: { projectId, note } });
      return true;
    } catch {
      return false;
    }
  };

  const editNote = async (id: string, note: string): Promise<boolean> => {
    try {
      await updateNoteM({ variables: { id, note } });
      return true;
    } catch {
      return false;
    }
  };

  const deleteNote = async (id: string): Promise<void> => {
    try {
      await deleteNoteM({ variables: { id } });
    } catch {
      /* errorLink already toasted */
    }
  };

  return {
    addNote,
    editNote,
    deleteNote,
    raw: { addNote: addNoteM },
  };
}
