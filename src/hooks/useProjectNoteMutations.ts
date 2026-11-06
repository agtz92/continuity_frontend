"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_PROJECT_NOTE,
  DELETE_PROJECT_NOTE,
  UPDATE_PROJECT_NOTE,
} from "@/lib/graphql";

import { insertAfter, removeAfter, syncAfter } from "@/lib/dashboardSync";

export function useProjectNoteMutations() {
  const [createNote, { loading: creating }] = useMutation(
    CREATE_PROJECT_NOTE,
    insertAfter("projectNotes", "createProjectNote")
  );
  const [updateNote, { loading: updating }] = useMutation(
    UPDATE_PROJECT_NOTE,
    syncAfter
  );
  const [deleteNote] = useMutation(DELETE_PROJECT_NOTE, removeAfter("projectNotes"));

  /** Create a new note. Returns true if it succeeded. */
  const create = async (input: {
    projectId: string;
    title: string;
    body: string;
  }): Promise<boolean> => {
    try {
      await createNote({
        variables: {
          data: {
            projectId: input.projectId,
            title: input.title,
            body: input.body,
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  };

  /** Update an existing note. */
  const update = async (input: {
    id: string;
    projectId: string;
    title: string;
    body: string;
  }): Promise<boolean> => {
    try {
      await updateNote({
        variables: {
          id: input.id,
          data: {
            projectId: input.projectId,
            title: input.title,
            body: input.body,
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    try {
      await deleteNote({ variables: { id } });
      return true;
    } catch {
      return false;
    }
  };

  return {
    create,
    update,
    remove,
    saving: creating || updating,
  };
}
