"use client";

import { useQuery } from "@apollo/client";
import { QUICK_NOTES_QUERY } from "@/lib/graphql";
import { skipWhenHidden, useRefetchOnFocus } from "./useRefetchOnFocus";
import type { QuickNote } from "@/lib/types";

/**
 * Loads the user's Quick Notes. Kept out of DASHBOARD_QUERY so note bodies
 * (which can be large) only load lazily when the Notes view mounts.
 */
export function useQuickNotes() {
  const { data, loading, error, refetch } = useQuery<{ quickNotes: QuickNote[] }>(
    QUICK_NOTES_QUERY,
    {
      fetchPolicy: "cache-and-network",
      pollInterval: 60_000,
      skipPollAttempt: skipWhenHidden,
    }
  );

  useRefetchOnFocus(refetch);

  return {
    quickNotes: data?.quickNotes ?? [],
    loading,
    error,
    refetch,
  };
}
