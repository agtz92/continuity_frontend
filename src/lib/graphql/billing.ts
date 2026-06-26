import { gql } from "@apollo/client";

export const CREATE_CHECKOUT_SESSION = gql`
  mutation CreateCheckoutSession(
    $plan: PurchasablePlan!
    $period: BillingPeriod!
    $locale: String
  ) {
    createCheckoutSession(plan: $plan, period: $period, locale: $locale) {
      url
    }
  }
`;


export const CREATE_PORTAL_SESSION = gql`
  mutation CreatePortalSession($locale: String) {
    createPortalSession(locale: $locale) {
      url
    }
  }
`;


export const APPLY_RETENTION_OFFER = gql`
  mutation ApplyRetentionOffer(
    $reason: CancellationReason!
    $feedbackText: String
  ) {
    applyRetentionOffer(reason: $reason, feedbackText: $feedbackText) {
      applied
      couponId
      reason
    }
  }
`;


export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription(
    $reason: CancellationReason!
    $feedbackText: String
  ) {
    cancelSubscription(reason: $reason, feedbackText: $feedbackText) {
      scheduled
      currentPeriodEnd
    }
  }
`;


export const REACTIVATE_SUBSCRIPTION = gql`
  mutation ReactivateSubscription {
    reactivateSubscription {
      success
    }
  }
`;


export const DOWNGRADE_TO_PLAN = gql`
  mutation DowngradeToPlan(
    $plan: PurchasablePlan!
    $period: BillingPeriod!
  ) {
    downgradeToPlan(plan: $plan, period: $period) {
      success
      fromPlan
      toPlan
    }
  }
`;

// ===== CMS / Blog / Pages =====

// Selección completa de un post de blog en el admin; reutilizado por todas las
// queries/mutations de ADMIN_BLOG_POST_* para devolver la fila editable entera.

export const ADMIN_BILLING_OVERVIEW_QUERY = gql`
  query AdminBillingOverview {
    adminBillingOverview {
      currency
      isTestMode
      payingSubscribers
      mrrCents
      arrCents
      billingExemptCount
      pendingCancellations
      breakdown {
        plan
        period
        count
        monthlyCentsEach
        totalMonthlyCents
      }
      upcomingChurn {
        userId
        email
        plan
        period
        planRenewsAt
        monthlyCents
      }
    }
  }
`;


export const ADMIN_SUBSCRIBERS_QUERY = gql`
  query AdminSubscribers(
    $page: Int
    $perPage: Int
    $plan: String
    $period: String
    $emailContains: String
    $includeExempt: Boolean
  ) {
    adminSubscribers(
      page: $page
      perPage: $perPage
      plan: $plan
      period: $period
      emailContains: $emailContains
      includeExempt: $includeExempt
    ) {
      rows {
        userId
        email
        plan
        period
        monthlyCents
        planRenewsAt
        cancelAtPeriodEnd
        isBillingExempt
        stripeCustomerId
        stripeSubscriptionId
      }
      page
      perPage
      hasNext
      total
    }
  }
`;

// ===== Admin: audit log =====
