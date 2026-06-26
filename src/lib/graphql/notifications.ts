import { gql } from "@apollo/client";

export const NOTIFICATIONS_QUERY = gql`
  query InAppNotifications {
    notifications {
      id
      kind
      severity
      title
      body
      ctaLabel
      ctaUrl
      dismissible
      i18nKind
      i18nVarsJson
    }
  }
`;

// ===== Admin: anuncios (announcements) =====

export const ADMIN_NOTIFICATION_JOBS_QUERY = gql`
  query AdminNotificationJobs(
    $page: Int
    $perPage: Int
    $status: String
    $channel: String
    $kind: String
    $userId: ID
  ) {
    adminNotificationJobs(
      page: $page
      perPage: $perPage
      status: $status
      channel: $channel
      kind: $kind
      userId: $userId
    ) {
      jobs {
        id
        userId
        channel
        kind
        dedupeKey
        body
        scheduledFor
        status
        attempts
        externalMessageId
        error
        created
        sentAt
      }
      page
      perPage
      hasNext
    }
  }
`;


export const ADMIN_NOTIFICATION_JOB_RETRY = gql`
  mutation AdminNotificationJobRetry($id: ID!) {
    adminNotificationJobRetry(id: $id) {
      id
      status
      error
    }
  }
`;

// ===== Admin: métricas y estadísticas del sistema =====

export const NOTIFICATION_SETTINGS_QUERY = gql`
  query NotificationSettings {
    notificationSettings {
      locale
      theme
      palette
      timezone
      digestEnabled
      digestDayOfWeek
      digestHour
      dailyDigestEnabled
      dailyDigestHour
      sleepingAlertsEnabled
      dueRemindersEnabled
      dueReminderHour
      manualEnabled
      isAdmin
      links {
        channel
        connected
        verifiedAt
      }
    }
  }
`;


export const UPDATE_NOTIFICATION_SETTINGS = gql`
  mutation UpdateNotificationSettings($data: NotificationSettingsInput!) {
    updateNotificationSettings(data: $data) {
      locale
      theme
      palette
      timezone
      digestEnabled
      digestDayOfWeek
      digestHour
      dailyDigestEnabled
      dailyDigestHour
      sleepingAlertsEnabled
      dueRemindersEnabled
      dueReminderHour
      manualEnabled
      isAdmin
      links {
        channel
        connected
        verifiedAt
      }
    }
  }
`;


export const REQUEST_CHANNEL_LINK = gql`
  mutation RequestChannelLink($channel: NotificationChannel!) {
    requestChannelLink(channel: $channel) {
      token
      deepLink
      expiresAt
    }
  }
`;


export const DISCONNECT_CHANNEL = gql`
  mutation DisconnectChannel($channel: NotificationChannel!) {
    disconnectChannel(channel: $channel)
  }
`;

// ===== Analytics (usuario) =====
