import { gql } from "@apollo/client";

export const BLOG_POST_FRAGMENT = gql`
  fragment AdminBlogPostFields on AdminBlogPost {
    id
    slug
    title
    excerpt
    contentJson
    contentHtml
    coverImageUrl
    status
    publishedAt
    tags
    seoTitle
    seoDescription
    locale
    createdAt
    updatedAt
  }
`;

// Selección completa de una página estática del CMS en el admin; reutilizado por
// todas las queries/mutations de ADMIN_PAGE_*.

export const PAGE_FRAGMENT = gql`
  fragment AdminPageFields on AdminPage {
    id
    path
    title
    excerpt
    contentJson
    contentHtml
    coverImageUrl
    status
    publishedAt
    showInNav
    navOrder
    seoTitle
    seoDescription
    locale
    createdAt
    updatedAt
  }
`;


export const ADMIN_HELP_CATEGORY_FIELDS = `
  id
  slug
  name
  description
  icon
  order
  locale
  createdAt
  updatedAt
  resourceCount
`;

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Selección de un recurso de ayuda; interpolado en todas las ADMIN_HELP_RESOURCE_*.

export const ADMIN_HELP_RESOURCE_FIELDS = `
  id
  slug
  title
  excerpt
  contentJson
  contentHtml
  coverImageUrl
  categoryId
  categorySlug
  categoryName
  status
  publishedAt
  tags
  seoTitle
  seoDescription
  locale
  order
  createdAt
  updatedAt
`;


export const ROUTINE_FIELDS = `
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
`;

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Selección de un bloqueador de tarea; reutilizado en las mutations de tareas y de blockers.

export const TASK_BLOCKER_FIELDS = `
  id
  blockedTaskId
  blockingTaskId
  externalDescription
  created
`;

// NOTE: es un string de campos, no un fragment gql — candidato a convertir en fragment.
// Selección de una ocurrencia de rutina (instancia de un día); reutilizado al completar ocurrencias.

export const ROUTINE_OCCURRENCE_FIELDS = `
  id
  routineId
  scheduledDate
  completedAt
  note
  created
`;


export const QUICK_NOTE_FIELDS = `
  id
  title
  categoryId
  projectId
  pinned
  created
  updatedAt
  sections {
    id
    noteId
    heading
    body
    position
    collapsed
    created
    updatedAt
  }
`;


export const ACTIVITY_FIELDS = `
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


export const ONBOARDING_STATE_FIELDS = `
  status
  currentStep
  tourStatus
  completedAt
  completedVia
  firstName
  avatar
  plan
  isBillingExempt
`;


export const TODAY_LAYOUT_FIELDS = `
  order
  hidden
`;


export const BETA_USER_FIELDS = `
  userId
  email
  createdAt
  betaCohort
  betaStatus
  isBillingExempt
  billingExemptReason
  billingExemptUntil
  betaEnrolledAt
  daysSinceLastSignificantEvent
  lastEmailId
  lastEmailAt
`;
