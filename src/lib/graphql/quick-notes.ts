import { gql } from "@apollo/client";
import { QUICK_NOTE_FIELDS } from "./fragments";

export const QUICK_NOTES_QUERY = gql`
  query QuickNotes($search: String, $categoryId: ID, $projectId: ID, $pinned: Boolean) {
    quickNotes(search: $search, categoryId: $categoryId, projectId: $projectId, pinned: $pinned) {
      ${QUICK_NOTE_FIELDS}
    }
  }
`;


export const CREATE_QUICK_NOTE = gql`
  mutation CreateQuickNote($data: QuickNoteInput!) {
    createQuickNote(data: $data) {
      ${QUICK_NOTE_FIELDS}
    }
  }
`;


export const UPDATE_QUICK_NOTE = gql`
  mutation UpdateQuickNote($id: ID!, $data: QuickNoteInput!) {
    updateQuickNote(id: $id, data: $data) {
      ${QUICK_NOTE_FIELDS}
    }
  }
`;


export const SET_QUICK_NOTE_PINNED = gql`
  mutation SetQuickNotePinned($id: ID!, $pinned: Boolean!) {
    setQuickNotePinned(id: $id, pinned: $pinned) {
      id
      pinned
      updatedAt
    }
  }
`;


export const DELETE_QUICK_NOTE = gql`
  mutation DeleteQuickNote($id: ID!) {
    deleteQuickNote(id: $id)
  }
`;


export const ADD_NOTE_SECTION = gql`
  mutation AddNoteSection($noteId: ID!, $data: NoteSectionInput!) {
    addNoteSection(noteId: $noteId, data: $data) {
      id
      noteId
      heading
      body
      position
      collapsed
      created
      updatedAt
    }
  }
`;


export const UPDATE_NOTE_SECTION = gql`
  mutation UpdateNoteSection($id: ID!, $data: NoteSectionInput!) {
    updateNoteSection(id: $id, data: $data) {
      id
      noteId
      heading
      body
      position
      collapsed
      created
      updatedAt
    }
  }
`;


export const DELETE_NOTE_SECTION = gql`
  mutation DeleteNoteSection($id: ID!) {
    deleteNoteSection(id: $id)
  }
`;


export const REORDER_NOTE_SECTIONS = gql`
  mutation ReorderNoteSections($noteId: ID!, $orderedIds: [ID!]!) {
    reorderNoteSections(noteId: $noteId, orderedIds: $orderedIds) {
      ${QUICK_NOTE_FIELDS}
    }
  }
`;

// ===== Actividad / notas de bitácora =====

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Selección de un evento de actividad/bitácora; reutilizado en ADD/UPDATE_NOTE (las
// notas de bitácora son entradas del feed de actividad).
