import { gql } from "@apollo/client";

export const GOOGLE_TASKS_CONNECTION_QUERY = gql`
  query GoogleTasksConnection {
    googleTasksConnection {
      connected
      email
      connectedAt
    }
  }
`;


export const GOOGLE_TASKS_AUTH_URL = gql`
  mutation GoogleTasksAuthUrl($returnTo: String!) {
    googleTasksAuthUrl(returnTo: $returnTo)
  }
`;


export const GOOGLE_TASK_LISTS_QUERY = gql`
  query GoogleTaskLists {
    googleTaskLists {
      id
      title
    }
  }
`;


export const IMPORT_GOOGLE_TASKS = gql`
  mutation ImportGoogleTasks($mappings: [GoogleTasksImportMapping!]!) {
    importGoogleTasks(mappings: $mappings) {
      imported
      skipped
      createdProjects
    }
  }
`;


export const DISCONNECT_GOOGLE_TASKS = gql`
  mutation DisconnectGoogleTasks {
    disconnectGoogleTasks
  }
`;

// ===== Integración: Calendario (feed iCal + Google + iCloud) =====


export const CALENDAR_INTEGRATION_QUERY = gql`
  query CalendarIntegration {
    calendarIntegration {
      feedUrl
      syncEnabled
      syncTasks
      syncRoutines
      googleConnected
      googleEmail
      googleCalendarId
      icloudConnected
      icloudAppleId
    }
  }
`;


export const GOOGLE_CALENDARS_QUERY = gql`
  query GoogleCalendars {
    googleCalendars {
      id
      title
      primary
    }
  }
`;


export const REGENERATE_CALENDAR_FEED_TOKEN = gql`
  mutation RegenerateCalendarFeedToken {
    regenerateCalendarFeedToken
  }
`;


export const GOOGLE_CALENDAR_AUTH_URL = gql`
  mutation GoogleCalendarAuthUrl($returnTo: String!) {
    googleCalendarAuthUrl(returnTo: $returnTo)
  }
`;


export const DISCONNECT_GOOGLE_CALENDAR = gql`
  mutation DisconnectGoogleCalendar {
    disconnectGoogleCalendar
  }
`;


export const SYNC_GOOGLE_CALENDAR_NOW = gql`
  mutation SyncGoogleCalendarNow {
    syncGoogleCalendarNow {
      created
      updated
      deleted
    }
  }
`;


export const CONNECT_ICLOUD_CALENDAR = gql`
  mutation ConnectICloudCalendar($appleId: String!, $appPassword: String!) {
    connectIcloudCalendar(appleId: $appleId, appPassword: $appPassword)
  }
`;


export const DISCONNECT_ICLOUD_CALENDAR = gql`
  mutation DisconnectICloudCalendar {
    disconnectIcloudCalendar
  }
`;


export const SYNC_ICLOUD_CALENDAR_NOW = gql`
  mutation SyncICloudCalendarNow {
    syncIcloudCalendarNow
  }
`;

// ===== Admin: beta lifecycle + app config =====

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Selección de un usuario beta (cohorte, estado, exención de billing, inactividad);
// reutilizado en la lista y en las mutations adminSetBeta/adminSetBillingExempt.
