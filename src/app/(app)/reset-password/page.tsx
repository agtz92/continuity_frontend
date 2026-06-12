"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * /reset-password — the page the user lands on after clicking the recovery
 * link in their email. By the time they get here, `/auth/callback` has
 * already exchanged the recovery code for a (temporary) session. We just
 * need to:
 *   1. Confirm the session is active (otherwise the link expired or was
 *      already used — punt them back to /login with an error code).
 *   2. Ask for the new password twice.
 *   3. Call updateUser({ password }) and send them to /dashboard.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        router.replace("/login?error=reset_expired");
        return;
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
        <p className="text-sm text-text-muted">Checking your link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
          New password.
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Set it, confirm it, you&apos;re back in.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">
              New password
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
            {loading ? "..." : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
