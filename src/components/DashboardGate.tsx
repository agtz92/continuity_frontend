"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  NOTIFICATION_SETTINGS_QUERY,
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
  children,
}: {
  initialSession: Session | null;
  /** La página del catch-all, que no pinta nada. Se renderiza igualmente
   *  para no romper el contrato de layout de Next. */
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const activeLocale = useLocale();
  // Write the response back into NOTIFICATION_SETTINGS_QUERY (no `id`, so
  // Apollo can't normalize it). Without this, useLocaleSync in the dashboard
  // would read the stale server default and flip the language back.
  const [updateSettings] = useMutation(UPDATE_NOTIFICATION_SETTINGS, {
    update: (cache, { data }) => {
      if (data?.updateNotificationSettings) {
        cache.writeQuery({
          query: NOTIFICATION_SETTINGS_QUERY,
          data: { notificationSettings: data.updateNotificationSettings },
        });
      }
    },
  });
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

  // Warm the onboarding route while the probe is in flight, so the bounce
  // below doesn't add a second cold server round-trip for brand-new users.
  useEffect(() => {
    router.prefetch("/onboarding");
  }, [router]);

  // A brand-new account is provisioned server-side with locale "en", but the
  // UI it just signed up in (and the onboarding it's about to see) uses the
  // cookie / Accept-Language locale. Adopt what the user is actually seeing,
  // once, while the account is untouched (`pending`) — otherwise onboarding
  // shows one language and the dashboard flips to the other right after.
  const localeAdoptedRef = useRef(false);
  useEffect(() => {
    if (!session || !onboardingProbe || localeAdoptedRef.current) return;
    if (onboardingProbe.onboardingState.status !== "pending") return;
    localeAdoptedRef.current = true;
    updateSettings({ variables: { data: { locale: activeLocale } } }).catch(
      () => {
        localeAdoptedRef.current = false;
      },
    );
  }, [session, onboardingProbe, activeLocale, updateSettings]);

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
  // A spinner (not a blank page): for a brand-new account this first probe is
  // the backend's first touch, which provisions the profile and seeds example
  // content, so it's the slowest request of the whole signup.
  const spinner = (
    <div className="min-h-screen grid place-items-center bg-bg text-text-muted">
      <Loader2 size={20} className="animate-spin" />
    </div>
  );
  if (!onboardingProbe) return spinner;
  const onboardingStatus = onboardingProbe.onboardingState.status;
  if (onboardingStatus === "pending" || onboardingStatus === "in_progress") {
    return spinner;
  }

  return (
    <>
      {children}
      <Dashboard />
    </>
  );
}
