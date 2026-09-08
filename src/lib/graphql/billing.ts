/**
 * Admin-side billing reads.
 *
 * The six subscriber mutations that used to live here (checkout, portal,
 * retention offer, cancel, reactivate, downgrade) are gone: the backend no
 * longer exposes them, and the web sells and manages plans through
 * RevenueCat's Web SDK instead — see `src/lib/revenuecat.ts`.
 */
import { gql } from "@apollo/client";

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
        billingSource
        billingCustomerId
        billingTransactionId
        billingProductId
        netMonthlyCents
      }
      page
      perPage
      hasNext
      total
    }
  }
`;

// ===== Admin: audit log =====
