"use client";

import { useQuery } from "@apollo/client";
import { ANALYTICS_QUERY } from "@/lib/graphql";
import { skipWhenHidden, useRefetchOnFocus } from "./useRefetchOnFocus";
import type { AnalyticsData, AnalyticsRange } from "@/lib/types";

export function useAnalyticsData(range: AnalyticsRange) {
  const { data, loading, error, refetch } = useQuery<{
    analytics: AnalyticsData;
  }>(ANALYTICS_QUERY, {
    variables: { range },
    fetchPolicy: "cache-and-network",
    pollInterval: 60_000,
    skipPollAttempt: skipWhenHidden,
  });

  useRefetchOnFocus(refetch);

  return {
    analytics: data?.analytics ?? null,
    loading,
    initialLoading: loading && !data,
    error,
    refetch,
  };
}
