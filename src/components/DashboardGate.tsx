"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UPDATE_NOTIFICATION_SETTINGS } from "@/lib/graphql";
import { isKnownTimezone } from "@/lib/timezones";
import Dashboard from "@/components/Dashboard";

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

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

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

  return <Dashboard />;
}
