"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { UPDATE_NOTIFICATION_SETTINGS } from "@/lib/graphql";
import { isKnownTimezone } from "@/lib/timezones";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [updateSettings] = useMutation(UPDATE_NOTIFICATION_SETTINGS);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
      if (!data.session) router.replace("/login");
    });
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

  if (checking) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted">
        Loading...
      </div>
    );
  }

  if (!session) return null;

  return <Dashboard />;
}
