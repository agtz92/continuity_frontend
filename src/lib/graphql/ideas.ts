import { gql } from "@apollo/client";

export const CREATE_IDEA = gql`
  mutation CreateIdea($data: IdeaInput!) {
    createIdea(data: $data) {
      id
      title
      description
      why
      created
    }
  }
`;


export const UPDATE_IDEA = gql`
  mutation UpdateIdea($id: ID!, $data: IdeaInput!) {
    updateIdea(id: $id, data: $data) {
      id
      title
      description
      why
      created
    }
  }
`;


export const DELETE_IDEA = gql`
  mutation DeleteIdea($id: ID!) {
    deleteIdea(id: $id)
  }
`;


export const PROMOTE_IDEA = gql`
  mutation PromoteIdea($id: ID!) {
    promoteIdea(id: $id) {
      id
      name
      status
      created
      lastActivity
    }
  }
`;

// ===== Quick Notes (cuaderno tipo Notion) =====

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Selección de una nota con sus secciones plegables anidadas; reutilizado en la query
// y en las mutations que devuelven la nota completa (create/update/reorder).
