"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { detectBrowserTimezone } from "@/lib/timezones";
import MarketingNav from "@/components/landing/MarketingNav";
import CTAButton from "@/components/landing/primitives/CTAButton";

type Mode = "signin" | "signup" | "forgot";
type View = "form" | "check_email_signup" | "check_email_reset";

function parseMode(raw: string | null): Mode {
  return raw === "signup" || raw === "forgot" ? raw : "signin";
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-ls-text-primary placeholder:text-ls-text-secondary/60 transition-colors focus:border-ls-ochre/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-ls-ochre/30";

const labelClass =
  "block text-xs uppercase tracking-[0.18em] text-ls-text-secondary mb-1.5";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-surface="marketing"
      className="relative min-h-screen bg-ls-navy text-ls-text-primary font-sans antialiased selection:bg-ls-ochre/30 selection:text-ls-text-primary"
    >
      <MarketingNav />
      {/* Ambient brand glow — matches Hero/FinalCall */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-ls-ochre/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[620px] translate-x-1/4 translate-y-1/4 rounded-full bg-ls-vermillion/10 blur-[100px]" />
      </div>
      <main className="flex min-h-screen items-center justify-center px-6 pb-16 pt-28 sm:pt-32">
        {children}
      </main>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = parseMode(searchParams.get("mode"));
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<Mode>(initialMode);
  const [view, setView] = useState<View>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmonHost =
    typeof window !== "undefined" &&
    window.location.host.toLowerCase().startsWith("admon.");

  const clearTransientState = () => {
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    clearTransientState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (error) {
          setError(error.message);
          return;
        }
        try {
          localStorage.setItem(
            "continuity:pending_timezone",
            detectBrowserTimezone()
          );
        } catch {
          // private mode / localStorage disabled — silently skip
        }
        setView("check_email_signup");
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) {
          setError(error.message);
          return;
        }
        setView("check_email_reset");
        return;
      }

      // signin
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      // On the admon.* subdomain, the middleware rewrites `/` to
      // `/admin` internally — send the user there instead of /dashboard
      // (which is the in-app surface only meaningful on the main host).
      router.replace(isAdmonHost ? "/" : "/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    // Mirror the email-signup path: stash the timezone before we leave the
    // origin so DashboardGate can apply it when the OAuth round-trip lands a
    // brand-new user. Harmless for returning users (it's consumed once).
    try {
      localStorage.setItem(
        "continuity:pending_timezone",
        detectBrowserTimezone()
      );
    } catch {
      // private mode / localStorage disabled — silently skip
    }
    const next = isAdmonHost ? "/" : "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
    // On success the browser navigates away to Google, so we only reach here
    // when the redirect could not be initiated.
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Post-action confirmation view — keeps the user on this page until
  // they click the email link, so they know exactly what to do next.
  if (view !== "form") {
    const isSignup = view === "check_email_signup";
    return (
      <Shell>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ls-ochre/40 bg-ls-ochre/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ls-ochre">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ls-ochre opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ls-ochre" />
            </span>
            Check your inbox
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-light leading-tight tracking-tight text-ls-text-primary">
            {isSignup ? (
              <>
                One step left,{" "}
                <span className="italic text-ls-ochre">builder</span>.
              </>
            ) : (
              <>
                Reset link <span className="italic text-ls-ochre">sent</span>.
              </>
            )}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ls-text-secondary">
            {isSignup ? (
              <>
                We sent a confirmation link to{" "}
                <span className="font-medium text-ls-text-primary">{email}</span>.
                Click it and you&apos;re in.
              </>
            ) : (
              <>
                We sent a reset link to{" "}
                <span className="font-medium text-ls-text-primary">{email}</span>.
                It expires in 1 hour.
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-ls-text-secondary/80">
            Didn&apos;t get it? Check spam. Or wait 60 seconds and try again.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setView("form");
                switchMode("signin");
              }}
              className="text-sm text-ls-ochre hover:text-ls-text-primary transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </motion.div>
      </Shell>
    );
  }

  const submitLabel = loading
    ? "..."
    : mode === "signin"
      ? "Sign in"
      : mode === "signup"
        ? "Create account"
        : "Send reset link";

  const eyebrow =
    mode === "signin"
      ? isAdmonHost
        ? "Admin panel"
        : "Welcome back"
      : mode === "signup"
        ? "Join the loop"
        : "Reset password";

  const headline =
    mode === "signin" ? (
      <>
        Sign in to{" "}
        <span className="italic text-ls-ochre">continuu.it</span>
      </>
    ) : mode === "signup" ? (
      <>
        Start <span className="italic text-ls-ochre">finishing</span>.
      </>
    ) : (
      <>
        Forgot your <span className="italic text-ls-ochre">password</span>?
      </>
    );

  const subhead =
    mode === "signin"
      ? isAdmonHost
        ? "Sign in to manage the platform."
        : "Pick up where you left off."
      : mode === "signup"
        ? "Create your account. We'll handle the rest."
        : "Enter your email and we'll send a reset link.";

  return (
    <Shell>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-ls-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-ls-ochre" />
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-light leading-[1.1] tracking-tight text-ls-text-primary">
            {headline}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ls-text-secondary">
            {subhead}
          </p>

          {mode !== "forgot" && (
            <div className="mt-7 space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white px-3.5 py-2.5 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-white/90 disabled:opacity-60"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                >
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
                  />
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] uppercase tracking-wider text-ls-text-secondary/70">
                  or
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`${mode === "forgot" ? "mt-7" : "mt-4"} space-y-4`}
          >
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className={`${labelClass} mb-0`}>
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[11px] uppercase tracking-wider text-ls-text-secondary hover:text-ls-ochre transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                />
              </div>
            )}
            {mode === "signup" && (
              <div>
                <label htmlFor="confirm-password" className={labelClass}>
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-ls-vermillion/40 bg-ls-vermillion/10 p-3 text-xs text-ls-text-primary">
                {error}
              </div>
            )}
            <div className="pt-2">
              <CTAButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {submitLabel}
              </CTAButton>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-sm text-ls-text-secondary hover:text-ls-ochre transition-colors"
              >
                No account yet?{" "}
                <span className="text-ls-text-primary underline-offset-4 hover:underline">
                  Create one
                </span>
              </button>
            )}
            {mode === "signup" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-sm text-ls-text-secondary hover:text-ls-ochre transition-colors"
              >
                Already a builder?{" "}
                <span className="text-ls-text-primary underline-offset-4 hover:underline">
                  Sign in
                </span>
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-sm text-ls-text-secondary hover:text-ls-ochre transition-colors"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs italic text-ls-text-secondary/80 font-display">
          Finish what you start.
        </p>
      </motion.div>
    </Shell>
  );
}
