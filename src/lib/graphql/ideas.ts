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


// `firstAction`, `categoryId` y `priority` son opcionales en el servidor para no
// romper la app nativa, que todavía manda solo el id. La web SÍ exige la primera
// acción, en el modal de promoción (ver REDISENO_DECISIONES.md, D-55).
export const PROMOTE_IDEA = gql`
  mutation PromoteIdea(
    $id: ID!
    $firstAction: String
    $categoryId: ID
    $priority: String
  ) {
    promoteIdea(
      id: $id
      firstAction: $firstAction
      categoryId: $categoryId
      priority: $priority
    ) {
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
