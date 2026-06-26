import { gql } from "@apollo/client";

export const CREATE_PROJECT_NOTE = gql`
  mutation CreateProjectNote($data: ProjectNoteInput!) {
    createProjectNote(data: $data) {
      id
      projectId
      title
      body
      created
      updatedAt
    }
  }
`;


export const UPDATE_PROJECT_NOTE = gql`
  mutation UpdateProjectNote($id: ID!, $data: ProjectNoteInput!) {
    updateProjectNote(id: $id, data: $data) {
      id
      projectId
      title
      body
      created
      updatedAt
    }
  }
`;


export const DELETE_PROJECT_NOTE = gql`
  mutation DeleteProjectNote($id: ID!) {
    deleteProjectNote(id: $id)
  }
`;

// ===== Proyectos =====
// La selección de campos del proyecto (incl. snapshots de paused*/killed* y `position`
// para el orden manual "Mi orden") se repite inline en CREATE/UPDATE_PROJECT.

export const CREATE_PROJECT = gql`
  mutation CreateProject($data: ProjectInput!) {
    createProject(data: $data) {
      id
      name
      description
      why
      nextStep
      status
      priority
      categoryId
      lastActivity
      created
      dueDate
      pausedContext
      pausedNextAction
      pausedBlocker
      pausedAt
      killedReason
      killedLearnings
      killedWouldRestart
      killedAt
      killedAiReflection
      stalledAt
      position
    }
  }
`;


export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $data: ProjectInput!) {
    updateProject(id: $id, data: $data) {
      id
      name
      description
      why
      nextStep
      status
      priority
      categoryId
      lastActivity
      created
      dueDate
      pausedContext
      pausedNextAction
      pausedBlocker
      pausedAt
      killedReason
      killedLearnings
      killedWouldRestart
      killedAt
      killedAiReflection
      stalledAt
      position
    }
  }
`;


export const REORDER_PROJECTS = gql`
  mutation ReorderProjects($orderedIds: [ID!]!) {
    reorderProjects(orderedIds: $orderedIds) {
      id
      position
    }
  }
`;

// Insight del "cementerio" de proyectos muertos (feature de cierre de estado): texto
// generado por IA, cacheado en backend con marca de obsolescencia (isStale).

export const GRAVEYARD_INSIGHT_QUERY = gql`
  query GraveyardInsight {
    graveyardInsight {
      body
      deathsCount
      computedAt
      isStale
    }
  }
`;

// ===== Categorías =====

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($data: CategoryInput!) {
    createCategory(data: $data) {
      id
      name
      color
      created
    }
  }
`;


export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $data: CategoryInput!) {
    updateCategory(id: $id, data: $data) {
      id
      name
      color
      created
    }
  }
`;


export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;


export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

// ===== Tareas =====
// La selección de la tarea (incl. parkedDue* y blockers vía TASK_BLOCKER_FIELDS) se
// repite inline en CREATE/UPDATE/TOGGLE_TASK.
