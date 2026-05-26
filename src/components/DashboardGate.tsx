"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  ONBOARDING_STATE_QUERY,
  UPDATE_NOTIFICATION_SETTINGS,
} from "@/lib/graphql";
import { isKnownTimezone } from "@/lib/timezones";
import Dashboard from "@/components/Dashboard";

type OnboardingProbe = {
  onboardingState: { status: string };
};

/**
 * Client-side gate that hydrates from a known-authenticated state. The server
 * page component (`src/app/page.tsx`) only mounts this when a Supabase session
 * cookie was present, so the initial render skips the loading flash. We still
 * subscribe to auth state changes here to handle sign-out (redirect to /login)
 * and run the pending-timezone sync that used to live in `page.tsx`.
 */
export default function DashboardGate({
  initialSession,
}: {
  initialSession: Session | null;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [updateSettings] = useMutation(UPDATE_NOTIFICATION_SETTINGS);
  const { data: onboardingProbe } = useQuery<OnboardingProbe>(
    ONBOARDING_STATE_QUERY,
    { fetchPolicy: "cache-and-network", skip: !session },
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // First-time users who haven't completed setup get bounced into the
  // onboarding flow. `completed` / `skipped` both pass through — the
  // skipped path is intentional ("I'll do it later" stays sticky).
  useEffect(() => {
    if (!session || !onboardingProbe) return;
    const status = onboardingProbe.onboardingState.status;
    if (status === "pending" || status === "in_progress") {
      router.replace("/onboarding");
    }
  }, [session, onboardingProbe, router]);

  useEffect(() => {
    if (!session) return;
    let pending: string | null = null;
    try {
      pending = localStorage.getItem("continuity:pending_timezone");
    } catch {
      return;
    }
    if (!pending) return;
    if (!isKnownTimezone(pending)) {
      try {
        localStorage.removeItem("continuity:pending_timezone");
      } catch {
        // ignore
      }
      return;
    }
    updateSettings({ variables: { data: { timezone: pending } } })
      .then(() => {
        try {
          localStorage.removeItem("continuity:pending_timezone");
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // leave key, retry on next render
      });
  }, [session, updateSettings]);

  if (!session) return null;

  // Until the onboarding probe resolves, render nothing rather than the
  // dashboard. Without this gate, first-time users see a Dashboard mount
  // (which also mounts the tour) for one frame before the effect above
  // redirects to /onboarding.
  if (!onboardingProbe) return null;
  const onboardingStatus = onboardingProbe.onboardingState.status;
  if (onboardingStatus === "pending" || onboardingStatus === "in_progress") {
    return null;
  }

  return <Dashboard />;
}
