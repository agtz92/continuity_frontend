"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  COMPLETE_ONBOARDING,
  MARK_TOUR,
  NOTIFICATION_SETTINGS_QUERY,
  ONBOARDING_STATE_QUERY,
  SET_ONBOARDING_STEP,
  UPDATE_NOTIFICATION_SETTINGS,
  UPDATE_PROFILE,
} from "@/lib/graphql";
import { THEME_COOKIE } from "@/theme/config";
import { PALETTE_COOKIE } from "@/palette/config";
import { setTheme as setThemeAction } from "@/theme/actions";
import { setPalette as setPaletteAction } from "@/palette/actions";
import { Step1Name } from "./steps/Step1Name";
import { Step2Theme } from "./steps/Step2Theme";
import { Step3Avatar } from "./steps/Step3Avatar";
import { Step4Plan } from "./steps/Step4Plan";
import { Step5Customize } from "./steps/Step5Customize";

const TOTAL_STEPS = 5;

// In-session step persistence. The current step is kept in sessionStorage so it
// survives an in-session remount of this component (e.g. a stray router.refresh
// from a sync hook, or any parent re-render that drops our state) WITHOUT
// snapping the user back to step 1. This is what finally kills the "pick avatar
// → bounced to step 1" glitch in replay mode: replay doesn't persist
// `current_step` server-side, so on a remount the resume logic would otherwise
// force step 1. sessionStorage (per-tab, cleared on tab close) is the right
// scope: a fresh visit starts clean, an in-session remount restores the step.
const STEP_STORAGE_KEY = "continuity.onboarding.step";

function readStoredStep(): number | null {
  if (typeof window === "undefined") return null;
  const n = Number(window.sessionStorage.getItem(STEP_STORAGE_KEY));
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_STEPS ? n : null;
}

function writeStoredStep(step: number): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STEP_STORAGE_KEY, String(step));
  }
}

function clearStoredStep(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STEP_STORAGE_KEY);
  }
}

type OnboardingStateData = {
  onboardingState: {
    status: "pending" | "in_progress" | "completed" | "skipped";
    currentStep: number;
    tourStatus: "pending" | "seen" | "skipped";
    completedAt: string | null;
    completedVia: string | null;
    firstName: string | null;
    avatar: string | null;
    plan: string;
    isBillingExempt: boolean;
  };
};

/**
 * Top-level onboarding state machine.
 *
 * Two modes:
 *   - first-time (default): writes status + currentStep to OnboardingProgress
 *     and redirects to /dashboard?tour=1 on completion.
 *   - replay (?replay=true): persists profile/theme/palette/avatar edits but
 *     does NOT touch OnboardingProgress.status. Tour is opt-in via a button
 *     on the final step.
 */
export function OnboardingFlow({ replay }: { replay: boolean }) {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const { data, loading } = useQuery<OnboardingStateData>(ONBOARDING_STATE_QUERY, {
    fetchPolicy: "network-only",
  });

  const [setStep] = useMutation(SET_ONBOARDING_STEP, {
    refetchQueries: [{ query: ONBOARDING_STATE_QUERY }],
  });
  const [completeOnboarding] = useMutation(COMPLETE_ONBOARDING, {
    refetchQueries: [{ query: ONBOARDING_STATE_QUERY }],
  });
  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: ONBOARDING_STATE_QUERY }],
  });
  const [markTour] = useMutation(MARK_TOUR, {
    refetchQueries: [{ query: ONBOARDING_STATE_QUERY }],
    awaitRefetchQueries: true,
  });
  const [updateSettings] = useMutation(UPDATE_NOTIFICATION_SETTINGS, {
    update: (cache, { data }) => {
      // Mirror the ThemeSelector pattern: write back so other sync hooks
      // see the fresh value on the next mount.
      if (data?.updateNotificationSettings) {
        cache.writeQuery({
          query: NOTIFICATION_SETTINGS_QUERY,
          data: { notificationSettings: data.updateNotificationSettings },
        });
      }
    },
  });

  const [step, setStepLocal] = useState<number>(1);
  const [oauthName, setOauthName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Pre-fill from Supabase auth metadata on first mount. Google OAuth puts
  // the user's name in raw_user_meta_data.full_name; we take the first
  // whitespace-delimited token as the default first name.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const meta = data.session?.user.user_metadata as
        | { full_name?: string; name?: string }
        | undefined;
      const raw = meta?.full_name || meta?.name || "";
      const first = raw.trim().split(/\s+/)[0] || "";
      if (first) setOauthName(first.slice(0, 50));
    });
  }, []);

  // Resolve the starting step on first hydrate. Runs exactly once (guarded by
  // resolvedRef). Two reasons it must not re-run on every `data` change: (1)
  // every step mutation carries `refetchQueries: [ONBOARDING_STATE_QUERY]`, and
  // those refetches race — re-applying the server's `current_step` here would
  // snap the UI back over the user's optimistic step; (2) it would clobber an
  // in-session restore. Mirrors the mobile flow's `resolved` ref.
  //
  // Resolution order:
  //   1. Already-done users (non-replay) bounce to the dashboard.
  //   2. An in-session step (sessionStorage) wins — this survives remounts so
  //      the user never gets thrown back to step 1 mid-flow.
  //   3. Replay starts at step 1; first-time resumes from the server step.
  const resolvedRef = useRef(false);
  useEffect(() => {
    if (!data || resolvedRef.current) return;
    const s = data.onboardingState;
    resolvedRef.current = true;

    if (!replay && (s.status === "completed" || s.status === "skipped")) {
      // Onboarding done. Bounce to dashboard (no tour — they finished or
      // skipped already and the tour state is what governs the dashboard
      // tour, not this page). Drop any stale in-session step first.
      clearStoredStep();
      setRedirecting(true);
      router.replace("/dashboard");
      return;
    }

    const stored = readStoredStep();
    if (stored) {
      setStepLocal(stored);
      return;
    }
    if (replay) {
      setStepLocal(1);
      return;
    }
    setStepLocal(Math.min(Math.max(s.currentStep, 1), TOTAL_STEPS));
  }, [data, replay, router]);

  const state = data?.onboardingState;
  const initialFirstName = state?.firstName ?? null;
  const prefillName = useMemo(
    () => initialFirstName || oauthName || "",
    [initialFirstName, oauthName],
  );

  if (loading || !state || redirecting) {
    return (
      <div className="flex-1 grid place-items-center text-text-muted">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  const handleSkipAll = async () => {
    if (busy || replay) return;
    setBusy(true);
    try {
      clearStoredStep();
      await completeOnboarding({ variables: { mode: "skipped" } });
      router.replace("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  const goToStep = async (next: number) => {
    if (next < 1 || next > TOTAL_STEPS) return;
    setStepLocal(next);
    // Persist so an in-session remount restores this step instead of resetting
    // to 1 (the core fix for the replay "bounce to step 1" glitch).
    writeStoredStep(next);
    if (!replay) {
      await setStep({ variables: { step: next } });
    }
  };

  const handleFinish = async ({
    skipTour: shouldSkipTour,
    forceTour,
    customize,
  }: {
    skipTour?: boolean;
    forceTour?: boolean;
    customize?: boolean;
  } = {}) => {
    if (busy) return;
    setBusy(true);
    try {
      // Leaving onboarding — drop the in-session step so a later visit starts
      // clean (a fresh replay begins at step 1, not wherever we left off).
      clearStoredStep();
      if (!replay) {
        await completeOnboarding({ variables: { mode: "finished" } });
      }
      // `customize` hands the user straight into the Today layout editor
      // (step 5's primary action). Suppress the dashboard tour on first-time
      // runs so the driver spotlight doesn't fight the edit UI for the screen;
      // replay never alters tour state.
      if (customize) {
        if (!replay) {
          await markTour({ variables: { seen: false } }).catch(() => undefined);
        }
        router.replace("/dashboard?customize=1");
        return;
      }
      // Default: first-time fires the tour; replay doesn't. Explicit flags
      // override: `skipTour: true` suppresses it for first-time runs (e.g.
      // when checkout takes over the navigation), `forceTour: true` arms
      // it for replay runs (the "Watch tour again" button).
      let shouldFireTour = !replay;
      if (shouldSkipTour) shouldFireTour = false;
      if (forceTour) shouldFireTour = true;
      const params = shouldFireTour ? "?tour=1" : "";
      router.replace(`/dashboard${params}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header: progress + skip */}
      <header className="flex items-center justify-between mb-8 sm:mb-12">
        <div className="text-xs uppercase tracking-wider text-text-muted">
          {t("progress", { current: step, total: TOTAL_STEPS })}
        </div>
        {!replay && (
          <button
            type="button"
            onClick={handleSkipAll}
            disabled={busy}
            className="text-xs text-text-muted hover:text-text transition-colors disabled:opacity-50"
          >
            {t("skip")}
          </button>
        )}
      </header>

      {/* Replay banner */}
      {replay && (
        <div className="mb-6 text-xs text-text-muted border border-border rounded-lg px-3 py-2">
          {t("replay.banner")}
        </div>
      )}

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const idx = i + 1;
          const active = idx === step;
          const done = idx < step;
          return (
            <span
              key={idx}
              className={`h-1 rounded-full transition-all ${
                active
                  ? "w-8 bg-accent"
                  : done
                    ? "w-4 bg-text-muted"
                    : "w-4 bg-border"
              }`}
            />
          );
        })}
      </div>

      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <Step1Name
            initialName={prefillName}
            isPrefillFromOAuth={!initialFirstName && !!oauthName}
            onNext={async (name) => {
              await updateProfile({
                variables: { firstName: name },
              });
              await goToStep(2);
            }}
            busy={busy}
          />
        )}
        {step === 2 && (
          <Step2Theme
            onBack={() => goToStep(1)}
            onNext={async ({ theme, palette }) => {
              await updateSettings({
                variables: { data: { theme, palette } },
              });
              // Persist the choice to the SSR cookies (NEXT_THEME / NEXT_PALETTE)
              // — the same cookies ThemeSelector/PaletteSelector write. The DB
              // row alone isn't enough: `resolveTheme`/`resolvePalette` read the
              // cookie, so without this the dashboard SSR falls back to the
              // default ("continuuit") and the user's pick visibly reverts after
              // onboarding. Cookie is set synchronously (what SSR needs on the
              // next navigation); the server actions revalidate in the
              // background.
              const maxAge = 60 * 60 * 24 * 365;
              document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${maxAge}; samesite=lax`;
              document.cookie = `${PALETTE_COOKIE}=${palette}; path=/; max-age=${maxAge}; samesite=lax`;
              void Promise.all([
                setThemeAction(theme),
                setPaletteAction(palette),
              ]).catch(() => undefined);
              await goToStep(3);
            }}
            busy={busy}
          />
        )}
        {step === 3 && (
          <Step3Avatar
            name={state.firstName || prefillName}
            onBack={() => goToStep(2)}
            onNext={async (avatarId) => {
              await updateProfile({
                variables: { avatar: avatarId },
              });
              await goToStep(4);
            }}
            busy={busy}
          />
        )}
        {step === 4 && (
          <Step4Plan
            name={state.firstName || prefillName}
            plan={state.plan}
            isBillingExempt={state.isBillingExempt}
            replay={replay}
            onBack={() => goToStep(3)}
            onContinue={() => goToStep(5)}
            busy={busy}
          />
        )}
        {step === 5 && (
          <Step5Customize
            replay={replay}
            onBack={() => goToStep(4)}
            onFinish={handleFinish}
            busy={busy}
          />
        )}
      </div>
    </main>
  );
}
