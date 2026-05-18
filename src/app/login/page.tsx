"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { detectBrowserTimezone } from "@/lib/timezones";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const { error } =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      if (mode === "signup") {
        try {
          localStorage.setItem(
            "continuity:pending_timezone",
            detectBrowserTimezone()
          );
        } catch {
          // private mode / localStorage disabled — silently skip
        }
      }
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
          Continuity
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {mode === "signin" ? "Sign in to your dashboard." : "Create your account."}
        </p>
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
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setConfirmPassword("");
            setError(null);
          }}
          className="mt-4 text-xs text-text-muted hover:text-text w-full text-center"
        >
          {mode === "signin"
            ? "No account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
