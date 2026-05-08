"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { DASHBOARD_QUERY } from "@/lib/graphql";
import type { Category, DashboardData, UpdateEntry } from "@/lib/types";

export function useDashboardData() {
  const { data, loading, error, refetch } = useQuery<{ dashboard: DashboardData }>(
    DASHBOARD_QUERY,
    { fetchPolicy: "cache-and-network" }
  );

  const projects = data?.dashboard.projects ?? [];
  const tasks = data?.dashboard.tasks ?? [];
  const ideas = data?.dashboard.ideas ?? [];
  const categories = data?.dashboard.categories ?? [];
  const lastBackup = data?.dashboard.lastBackup ?? null;

  const categoryById = useMemo<Record<string, Category>>(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Updates sorted newest-first (used everywhere they appear).
  const updates = useMemo<UpdateEntry[]>(() => {
    const list = data?.dashboard.updates ?? [];
    return [...list].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data]);

  /** True only during the very first load (before any data has come back). */
  const initialLoading = loading && !data;

  return {
    projects,
    tasks,
    ideas,
    updates,
    categories,
    categoryById,
    lastBackup,
    loading,
    initialLoading,
    error,
    refetch,
  };
}
