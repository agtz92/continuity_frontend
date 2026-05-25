"use client";

import { useTranslations } from "next-intl";
import type { ApolloError } from "@apollo/client";

/**
 * Maps backend GraphQL error codes to a human-readable, localized message.
 *
 * The backend never localizes — it returns a structured error with
 * `extensions.code` and machine-readable fields. The frontend is the only
 * layer that knows the user's locale, so all user-facing copy lives in
 * `messages/*.json` under `errors.*` and is resolved here.
 */
export type BillingErrorCode =
  | "QUOTA_EXCEEDED"
  | "RETENTION_ALREADY_USED"
  | "NO_ACTIVE_SUBSCRIPTION"
  | "BILLING_NOT_CONFIGURED"
  | "UNAUTHENTICATED"
  | "BAD_INPUT";

export interface BillingErrorExtensions {
  code?: BillingErrorCode | string;
  kind?: string; // QUOTA_EXCEEDED only
  current?: number;
  cap?: number;
  plan?: string;
}

export function extractBillingError(
  err: ApolloError | Error | undefined
): { code: string | null; ext: BillingErrorExtensions; raw: string } {
  if (!err) return { code: null, ext: {}, raw: "" };
  const apollo = err as ApolloError;
  const first = apollo.graphQLErrors?.[0];
  const ext = (first?.extensions || {}) as BillingErrorExtensions;
  return {
    code: (ext.code as string) || null,
    ext,
    raw: err.message,
  };
}

export function useBillingErrorMessage() {
  const t = useTranslations("errors");

  return (err: ApolloError | Error | undefined): string => {
    const { code, ext, raw } = extractBillingError(err);
    if (!code) return raw;
    switch (code) {
      case "QUOTA_EXCEEDED": {
        const kind = ext.kind || "default";
        const key = `quota.${kind}`;
        // Fall back to the generic message if no kind-specific key exists.
        try {
          return t(key, {
            current: ext.current ?? 0,
            cap: ext.cap ?? 0,
            plan: ext.plan ?? "free",
          });
        } catch {
          return t("quota.default", {
            current: ext.current ?? 0,
            cap: ext.cap ?? 0,
            plan: ext.plan ?? "free",
          });
        }
      }
      case "RETENTION_ALREADY_USED":
        return t("retentionAlreadyUsed");
      case "NO_ACTIVE_SUBSCRIPTION":
        return t("noActiveSubscription");
      case "BILLING_NOT_CONFIGURED":
        return t("billingNotConfigured");
      case "UNAUTHENTICATED":
        return t("unauthenticated");
      case "BAD_INPUT":
        return t("badInput");
      default:
        return raw;
    }
  };
}
