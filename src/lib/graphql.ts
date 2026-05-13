import { gql } from "@apollo/client";

export const DASHBOARD_QUERY = gql`
  query Dashboard {
    dashboard {
      projects {
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
      }
      ideas {
        id
        title
        description
        why
        created
      }
      activities {
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

const ROUTINE_FIELDS = `
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
`;

const ROUTINE_OCCURRENCE_FIELDS = `
  id
  routineId
  scheduledDate
  completedAt
  note
  created
`;

export const CREATE_ROUTINE = gql`
  mutation CreateRoutine($data: RoutineInput!) {
    createRoutine(data: $data) {
      ${ROUTINE_FIELDS}
    }
  }
`;

export const UPDATE_ROUTINE = gql`
  mutation UpdateRoutine($id: ID!, $data: RoutineInput!) {
    updateRoutine(id: $id, data: $data) {
      ${ROUTINE_FIELDS}
    }
  }
`;

export const ARCHIVE_ROUTINE = gql`
  mutation ArchiveRoutine($id: ID!, $archived: Boolean!) {
    archiveRoutine(id: $id, archived: $archived) {
      ${ROUTINE_FIELDS}
    }
  }
`;

export const DELETE_ROUTINE = gql`
  mutation DeleteRoutine($id: ID!) {
    deleteRoutine(id: $id)
  }
`;

export const COMPLETE_ROUTINE_OCCURRENCE = gql`
  mutation CompleteRoutineOccurrence(
    $routineId: ID!
    $scheduledDate: Date!
    $note: String
  ) {
    completeRoutineOccurrence(
      routineId: $routineId
      scheduledDate: $scheduledDate
      note: $note
    ) {
      ${ROUTINE_OCCURRENCE_FIELDS}
    }
  }
`;

export const UNCOMPLETE_ROUTINE_OCCURRENCE = gql`
  mutation UncompleteRoutineOccurrence($id: ID!) {
    uncompleteRoutineOccurrence(id: $id)
  }
`;

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
    }
  }
`;

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
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

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

const ACTIVITY_FIELDS = `
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

export const MARK_BACKUP = gql`
  mutation MarkBackup {
    markBackup
  }
`;

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
      dueReminderLeadHours
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
      dueReminderLeadHours
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

export const ANALYTICS_QUERY = gql`
  query Analytics($range: AnalyticsRange!) {
    analytics(range: $range) {
      range
      rangeStart
      rangeEnd
      cadence {
        currentStreak
        longestStreak
        activeDaysInRange
        totalActivityEvents
      }
      activitySeries {
        day
        updates
        completedTasks
        totalEvents
      }
      weekdayHeatmap {
        weekday
        count
      }
      topProjects {
        projectId
        name
        status
        interactions
        deltaVsPrev
      }
      statusCounts {
        status
        count
      }
      categoryBreakdown {
        categoryId
        name
        color
        projectCount
        interactions
      }
      backlog {
        overdueTasks
        dueSoonTasks
        openTasks
        quickWins
        almostThere
      }
      sleepingProjects {
        projectId
        name
        daysIdle
        bucket
      }
      staleIdeas {
        ideaId
        title
        daysOld
      }
      ideaFunnel {
        ideasCreated
        ideasPromoted
        promotionRate
      }
      effort {
        effortHoursTotal
        tasksWithEffortPct
        effortHoursByProject {
          projectId
          name
          hours
        }
      }
    }
  }
`;

export const PROFILE_QUERY = gql`
  query Profile {
    profile {
      avatar
    }
  }
`;

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
  mutation UpdateProfile($avatar: String) {
    updateProfile(avatar: $avatar) {
      avatar
    }
  }
`;
