import { gql } from "@apollo/client";

// Ventana de actividad del dashboard: solo los eventos de los últimos N días
// (las notas escritas viajan todas). Sin tope, cada refetch —tras cada
// mutation, el polling y al volver a la pestaña— bajaba la historia completa.
// Va fijo en el documento y no como variable para que la clave de caché sea la
// misma en cada `refetchQueries` y `updateQuery`. La Bitácora pide el resto
// con `ACTIVITY_QUERY`. Mismo valor que en `continuity-mobile`.
export const DASHBOARD_ACTIVITY_DAYS = 60;

// Selección de proyecto y de activity del dashboard. `DASHBOARD_DELTA_QUERY` usa
// las mismas: lo que trae se escribe en la lista cacheada del dashboard y un
// campo de menos dejaría la query incompleta.
const DASHBOARD_PROJECT_FIELDS = `
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
  daysSinceTouch
  cooling
  blockedSince
  isBlocked
`;

const DASHBOARD_ACTIVITY_FIELDS = `
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
`;

export const DASHBOARD_QUERY = gql`
  query Dashboard {
    dashboard(activityDays: ${DASHBOARD_ACTIVITY_DAYS}) {
      projects {
        ${DASHBOARD_PROJECT_FIELDS}
      }
      tasks {
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
        blockedSince
        blockedReason
        position
        blockers {
          id
          blockedTaskId
          blockingTaskId
          externalDescription
          created
        }
      }
      ideas {
        id
        title
        description
        why
        created
      }
      activities {
        ${DASHBOARD_ACTIVITY_FIELDS}
      }
      categories {
        id
        name
        color
        created
      }
      projectNotes {
        id
        projectId
        title
        body
        created
        updatedAt
      }
      routines {
        id
        title
        description
        recurrenceType
        startDate
        endDate
        weekdays
        intervalN
        intervalUnit
        monthlyDay
        effortHours
        archived
        created
        projectId
        timeOfDay
        durationMinutes
      }
      routineOccurrences {
        id
        routineId
        scheduledDate
        completedAt
        note
        created
      }
      lastBackup
    }
  }
`;

/**
 * Reconciliación barata tras escribir (ver `lib/dashboardSync.ts`): todos los
 * proyectos con sus derivados y las activities desde `since`.
 */
export const DASHBOARD_DELTA_QUERY = gql`
  query DashboardDelta($since: DateTime!) {
    dashboardDelta(since: $since) {
      projects {
        ${DASHBOARD_PROJECT_FIELDS}
      }
      activities {
        ${DASHBOARD_ACTIVITY_FIELDS}
      }
    }
  }
`;

// ===== Rutinas =====

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Selección de una rutina; reutilizado en CREATE/UPDATE/ARCHIVE_ROUTINE.
