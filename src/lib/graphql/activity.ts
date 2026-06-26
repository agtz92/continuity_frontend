import { gql } from "@apollo/client";
import { ACTIVITY_FIELDS } from "./fragments";

export const ADD_NOTE = gql`
  mutation AddNote($projectId: ID!, $note: String!) {
    addNote(projectId: $projectId, note: $note) {
      ${ACTIVITY_FIELDS}
    }
  }
`;


export const UPDATE_NOTE = gql`
  mutation UpdateNote($id: ID!, $note: String!) {
    updateNote(id: $id, note: $note) {
      ${ACTIVITY_FIELDS}
    }
  }
`;


export const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id)
  }
`;

// ===== Backup =====

export const ACTIVITY_QUERY = gql`
  query ActivityFeed(
    $limit: Int
    $since: DateTime
    $until: DateTime
    $projectId: ID
    $kinds: [String!]
  ) {
    activity(
      limit: $limit
      since: $since
      until: $until
      projectId: $projectId
      kinds: $kinds
    ) {
      id
      kind
      entityId
      entityTitle
      projectId
      targetProjectId
      note
      previousValue
      newValue
      created
    }
  }
`;


export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($avatar: String, $firstName: String) {
    updateProfile(avatar: $avatar, firstName: $firstName) {
      avatar
      firstName
    }
  }
`;

// ===== Integración: Google Tasks (importación) =====
