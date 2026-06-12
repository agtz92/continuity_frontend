"use client";

import { useMutation } from "@apollo/client";
import {
  ADD_NOTE_SECTION,
  CREATE_QUICK_NOTE,
  DELETE_NOTE_SECTION,
  DELETE_QUICK_NOTE,
  QUICK_NOTES_QUERY,
  REORDER_NOTE_SECTIONS,
  SET_QUICK_NOTE_PINNED,
  UPDATE_NOTE_SECTION,
  UPDATE_QUICK_NOTE,
} from "@/lib/graphql";
import type { NoteSection, QuickNote } from "@/lib/types";

const refetchAfter = { refetchQueries: [{ query: QUICK_NOTES_QUERY }] };

type NotePatch = {
  title?: string;
  categoryId?: string | null;
  projectId?: string | null;
  pinned?: boolean;
};

type SectionPatch = {
  heading?: string;
  body?: string;
  collapsed?: boolean;
  position?: number | null;
};

export function useQuickNoteMutations() {
  const [createM] = useMutation(CREATE_QUICK_NOTE, refetchAfter);
  const [updateM] = useMutation(UPDATE_QUICK_NOTE, refetchAfter);
  const [pinM] = useMutation(SET_QUICK_NOTE_PINNED, refetchAfter);
  const [deleteM] = useMutation(DELETE_QUICK_NOTE, refetchAfter);
  const [addSectionM] = useMutation(ADD_NOTE_SECTION, refetchAfter);
  const [updateSectionM] = useMutation(UPDATE_NOTE_SECTION, refetchAfter);
  const [deleteSectionM] = useMutation(DELETE_NOTE_SECTION, refetchAfter);
  const [reorderM] = useMutation(REORDER_NOTE_SECTIONS, refetchAfter);

  const createNote = async (
    patch: NotePatch = {}
  ): Promise<QuickNote | null> => {
    try {
      const res = await createM({
        variables: {
          data: {
            title: patch.title ?? "",
            categoryId: patch.categoryId ?? null,
            projectId: patch.projectId ?? null,
            pinned: patch.pinned ?? false,
          },
        },
      });
      return (res.data?.createQuickNote as QuickNote) ?? null;
    } catch {
      return null;
    }
  };

  /** Full-document update. Callers pass the note's current values for fields
   * they aren't changing (the input replaces all four fields server-side). */
  const updateNote = async (
    id: string,
    data: Required<NotePatch>
  ): Promise<boolean> => {
    try {
      await updateM({ variables: { id, data } });
      return true;
    } catch {
      return false;
    }
  };

  const setPinned = async (id: string, pinned: boolean): Promise<void> => {
    try {
      await pinM({ variables: { id, pinned } });
    } catch {
      /* errorLink toasted */
    }
  };

  const deleteNote = async (id: string): Promise<void> => {
    try {
      await deleteM({ variables: { id } });
    } catch {
      /* errorLink toasted */
    }
  };

  const addSection = async (
    noteId: string,
    patch: SectionPatch = {}
  ): Promise<NoteSection | null> => {
    try {
      const res = await addSectionM({
        variables: {
          noteId,
          data: {
            heading: patch.heading ?? "",
            body: patch.body ?? "",
            collapsed: patch.collapsed ?? false,
            position: patch.position ?? null,
          },
        },
      });
      return (res.data?.addNoteSection as NoteSection) ?? null;
    } catch {
      return null;
    }
  };

  const updateSection = async (
    id: string,
    data: { heading: string; body: string; collapsed: boolean }
  ): Promise<boolean> => {
    try {
      await updateSectionM({ variables: { id, data } });
      return true;
    } catch {
      return false;
    }
  };

  const deleteSection = async (id: string): Promise<void> => {
    try {
      await deleteSectionM({ variables: { id } });
    } catch {
      /* errorLink toasted */
    }
  };

  const reorderSections = async (
    noteId: string,
    orderedIds: string[]
  ): Promise<void> => {
    try {
      await reorderM({ variables: { noteId, orderedIds } });
    } catch {
      /* errorLink toasted */
    }
  };

  return {
    createNote,
    updateNote,
    setPinned,
    deleteNote,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
  };
}
