import { gql } from "@apollo/client";
import { TASK_BLOCKER_FIELDS } from "./fragments";

export const CREATE_TASK = gql`
  mutation CreateTask($data: TaskInput!) {
    createTask(data: $data) {
      id
      title
      projectId
      dueDate
      done
      completedAt
      created
      effortHours
      dueTime
      durationMinutes
      parkedDueDate
      parkedDueTime
      blockers {
        ${TASK_BLOCKER_FIELDS}
      }
    }
  }
`;


export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $data: TaskInput!) {
    updateTask(id: $id, data: $data) {
      id
      title
      projectId
      dueDate
      done
      completedAt
      created
      effortHours
      dueTime
      durationMinutes
      parkedDueDate
      parkedDueTime
      blockers {
        ${TASK_BLOCKER_FIELDS}
      }
    }
  }
`;


export const TOGGLE_TASK = gql`
  mutation ToggleTask($id: ID!) {
    toggleTask(id: $id) {
      id
      title
      projectId
      dueDate
      done
      completedAt
      created
      effortHours
      dueTime
      durationMinutes
      parkedDueDate
      parkedDueTime
      blockers {
        ${TASK_BLOCKER_FIELDS}
      }
    }
  }
`;

// State-closure revive: re-apply the parked due-date snapshots for a project's
// tasks ("restore original dates"), or drop them ("keep unscheduled").

export const RESTORE_PARKED_DUE_DATES = gql`
  mutation RestoreParkedDueDates($projectId: ID!) {
    restoreParkedDueDates(projectId: $projectId)
  }
`;


export const DISMISS_PARKED_DUE_DATES = gql`
  mutation DismissParkedDueDates($projectId: ID!) {
    dismissParkedDueDates(projectId: $projectId)
  }
`;


export const ADD_TASK_BLOCKER = gql`
  mutation AddTaskBlocker($data: TaskBlockerInput!) {
    addTaskBlocker(data: $data) {
      ${TASK_BLOCKER_FIELDS}
    }
  }
`;


export const REMOVE_TASK_BLOCKER = gql`
  mutation RemoveTaskBlocker($id: ID!) {
    removeTaskBlocker(id: $id)
  }
`;


export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

// ===== Ideas =====
