import { gql } from "@apollo/client";
import { BETA_USER_FIELDS } from "./fragments";

export const ADMIN_MCP_OVERVIEW_QUERY = gql`
  query AdminMcpOverview {
    adminMcpStats {
      activeConnections
      distinctUsers
      byClient {
        label
        count
      }
    }
    adminMcpConnections(limit: 50) {
      userId
      clientId
      clientName
      connectedAt
    }
    adminMcpConnectionEvents(limit: 50) {
      userId
      clientId
      clientName
      event
      created
    }
  }
`;


export const ADMIN_REVOKE_MCP_CONNECTION = gql`
  mutation AdminRevokeMcpConnection($userId: ID!, $clientId: String!) {
    adminRevokeMcpConnection(userId: $userId, clientId: $clientId)
  }
`;

// ===== Notificaciones in-app (usuario) =====

export const ADMIN_USERS_QUERY = gql`
  query AdminUsers(
    $page: Int
    $perPage: Int
    $emailContains: String
    $plan: String
    $adminsOnly: Boolean
  ) {
    adminUsers(
      page: $page
      perPage: $perPage
      emailContains: $emailContains
      plan: $plan
      adminsOnly: $adminsOnly
    ) {
      users {
        userId
        email
        plan
        isAdmin
        isBillingExempt
        createdAt
        lastSignInAt
        lastActivity
        interactions30d
        counts {
          projects
          tasksOpen
          tasksDone
          ideas
          notes
        }
      }
      page
      perPage
      hasNext
    }
  }
`;


export const ADMIN_USER_QUERY = gql`
  query AdminUser($userId: ID!) {
    adminUser(userId: $userId) {
      userId
      email
      plan
      isAdmin
      isBillingExempt
      planRenewsAt
      billingCustomerId
      billingTransactionId
      createdAt
      lastSignInAt
      emailConfirmedAt
      bannedUntil
      lastActivity
      interactions30dTotal
      interactionsBySource {
        label
        count
      }
      counts {
        projects
        tasksOpen
        tasksDone
        ideas
        notes
      }
      usageLast30d {
        date
        messagesSent
        tokensIn
        tokensOut
        costUsdCents
      }
      notifications {
        digestEnabled
        dailyDigestEnabled
        dueRemindersEnabled
        sleepingAlertsEnabled
        isAdmin
        links {
          channel
          verified
          created
        }
      }
    }
  }
`;


export const ADMIN_SET_USER_PLAN = gql`
  mutation AdminSetUserPlan($userId: ID!, $plan: String!) {
    adminSetUserPlan(userId: $userId, plan: $plan) {
      userId
      plan
      isAdmin
    }
  }
`;


export const ADMIN_SET_USER_IS_ADMIN = gql`
  mutation AdminSetUserIsAdmin($userId: ID!, $isAdmin: Boolean!) {
    adminSetUserIsAdmin(userId: $userId, isAdmin: $isAdmin) {
      userId
      isAdmin
    }
  }
`;


export const ADMIN_SET_USER_IS_BILLING_EXEMPT = gql`
  mutation AdminSetUserIsBillingExempt(
    $userId: ID!
    $isBillingExempt: Boolean!
  ) {
    adminSetUserIsBillingExempt(
      userId: $userId
      isBillingExempt: $isBillingExempt
    ) {
      userId
      isBillingExempt
    }
  }
`;

// ===== Billing (Stripe: checkout, portal, cancelación, downgrade) =====

export const ADMIN_SYSTEM_STATS_QUERY = gql`
  query AdminSystemStats {
    adminSystemStats {
      totalUsers
      totalAccounts
      admins
      dau
      wau
      mau
      blogPostsPublished
      blogPostsDraft
      pagesPublished
      pendingJobs
      failedJobs
      tasksOpen
      tasksDone30d
      ideasTotal
      planCounts {
        plan
        count
      }
      jobStatusCounts {
        status
        count
      }
      signupsSeries {
        date
        value
      }
      activitySeries {
        date
        value
      }
      activityByKind {
        label
        count
      }
      projectStateCounts {
        label
        count
      }
      recentSignups {
        userId
        email
        createdAt
        plan
      }
    }
  }
`;

// ===== Admin: billing (MRR/ARR, suscriptores, churn) =====

export const ADMIN_AUDIT_LOG_QUERY = gql`
  query AdminAuditLog(
    $page: Int
    $perPage: Int
    $actorUserId: ID
    $actionContains: String
    $targetUserId: ID
  ) {
    adminAuditLog(
      page: $page
      perPage: $perPage
      actorUserId: $actorUserId
      actionContains: $actionContains
      targetUserId: $targetUserId
    ) {
      entries {
        id
        actorUserId
        action
        targetType
        targetId
        payload
        created
      }
      page
      perPage
      hasNext
    }
  }
`;

// ===== Dashboard / core =====

// Carga inicial del dashboard: trae en un solo round-trip todo el estado del usuario
// (proyectos, tareas, ideas, actividad, categorías, notas de proyecto, rutinas y sus
// ocurrencias). Las field-lists se repiten inline aquí en vez de reutilizar los
// fragments/strings de abajo — punto a unificar en el refactor.

export const ADMIN_BETA_USERS_QUERY = gql`
  query AdminBetaUsers(
    $betaStatus: String
    $billingExempt: Boolean
    $daysInactiveMin: Int
  ) {
    adminBetaUsers(
      betaStatus: $betaStatus
      billingExempt: $billingExempt
      daysInactiveMin: $daysInactiveMin
    ) {
      ${BETA_USER_FIELDS}
    }
  }
`;


export const ADMIN_BETA_PIPELINE_QUERY = gql`
  query AdminBetaPipeline {
    adminBetaPipeline {
      statusCounts {
        label
        count
      }
      thresholdCounts {
        label
        count
      }
      recentReclaims {
        userId
        email
        betaStatus
      }
      lastRunAt
      lastRunMode
      lastRunSummary
    }
  }
`;


export const ADMIN_APP_CONFIG_QUERY = gql`
  query AdminAppConfig {
    adminAppConfig {
      key
      valueJson
    }
  }
`;


export const ADMIN_SET_BETA = gql`
  mutation AdminSetBeta(
    $userId: ID!
    $betaCohort: Boolean
    $betaStatus: String
  ) {
    adminSetBeta(
      userId: $userId
      betaCohort: $betaCohort
      betaStatus: $betaStatus
    ) {
      ${BETA_USER_FIELDS}
    }
  }
`;


export const ADMIN_SET_BILLING_EXEMPT = gql`
  mutation AdminSetBillingExempt(
    $userId: ID!
    $isBillingExempt: Boolean!
    $reason: String
    $until: DateTime
  ) {
    adminSetBillingExempt(
      userId: $userId
      isBillingExempt: $isBillingExempt
      reason: $reason
      until: $until
    ) {
      ${BETA_USER_FIELDS}
    }
  }
`;


export const ADMIN_SET_APP_CONFIG = gql`
  mutation AdminSetAppConfig($key: String!, $valueJson: String!) {
    adminSetAppConfig(key: $key, valueJson: $valueJson) {
      key
      valueJson
    }
  }
`;


export const ADMIN_SEND_TEST_EMAIL = gql`
  mutation AdminSendTestEmail($emailId: String!, $locale: String) {
    adminSendTestEmail(emailId: $emailId, locale: $locale)
  }
`;
