"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { detectBrowserTimezone } from "@/lib/timezones";

type Mode = "signin" | "signup" | "forgot";
type View = "form" | "check_email_signup" | "check_email_reset";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
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

  // Post-action confirmation view — keeps the user on this page until
  // they click the email link, so they know exactly what to do next.
  if (view !== "form") {
    const isSignup = view === "check_email_signup";
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
        <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-3 py-1 text-xs font-medium text-accent">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
            />
            Check your inbox
          </div>
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            {isSignup ? "One step left, builder." : "Reset link sent."}
          </h1>
          <p className="text-sm text-text-muted mb-2 leading-relaxed">
            {isSignup ? (
              <>
                We sent a confirmation link to{" "}
                <span className="text-text font-medium">{email}</span>. Click it
                and you&apos;re in.
              </>
            ) : (
              <>
                We sent a reset link to{" "}
                <span className="text-text font-medium">{email}</span>. It
                expires in 1 hour.
              </>
            )}
          </p>
          <p className="text-xs text-text-muted mb-6">
            Didn&apos;t get it? Check spam. Or wait 60 seconds and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              setView("form");
              switchMode("signin");
            }}
            className="w-full px-4 py-2.5 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  const submitLabel = loading
    ? "..."
    : mode === "signin"
      ? "Sign in"
      : mode === "signup"
        ? "Create account"
        : "Send reset link";

  const subhead =
    mode === "signin"
      ? isAdmonHost
        ? "Sign in to the admin panel."
        : "Sign in to your dashboard."
      : mode === "signup"
        ? "Create your account."
        : "Enter your email and we'll send a reset link.";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
          Continuity
        </h1>
        <p className="text-sm text-text-muted mb-6">{subhead}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
          {mode === "signup" && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 text-bg rounded-lg font-medium text-sm"
          >
            {submitLabel}
          </button>
        </form>
        <div className="mt-4 flex flex-col items-center gap-2">
          {mode === "signin" && (
            <>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-xs text-text-muted hover:text-text"
              >
                No account? Create one
              </button>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-xs text-text-muted hover:text-text"
              >
                Forgot password?
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-xs text-text-muted hover:text-text"
            >
              Already have an account? Sign in
            </button>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-xs text-text-muted hover:text-text"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
