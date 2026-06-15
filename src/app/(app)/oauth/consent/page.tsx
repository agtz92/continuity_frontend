"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, Eye, Pencil, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { assistantBaseUrl } from "@/lib/assistantApi";

type Status =
  | "checking"
  | "ready"
  | "unauth"
  | "connecting"
  | "invalid"
  | "error";

export default function OAuthConsentPage() {
  const t = useTranslations("settings.plugins.oauthConsent");
  const params = useSearchParams();

  const clientId = params.get("client_id") || "";
  const redirectUri = params.get("redirect_uri") || "";
  const codeChallenge = params.get("code_challenge") || "";
  const method = params.get("code_challenge_method") || "S256";
  const scope = params.get("scope") || "";
  const state = params.get("state") || "";
  const appName = params.get("client_name") || "Claude";

  const canWrite = scope.includes("continuity:write");

  const [status, setStatus] = useState<Status>("checking");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !redirectUri || !codeChallenge) {
      setStatus("invalid");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        setToken(data.session.access_token);
        setStatus("ready");
      } else {
        setStatus("unauth");
      }
    });
  }, [clientId, redirectUri, codeChallenge]);

  const allow = async () => {
    if (!token) return;
    setStatus("connecting");
    try {
      const res = await fetch(`${assistantBaseUrl}/oauth/authorize/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge,
          code_challenge_method: method,
          scope,
          state,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      window.location.href = data.redirect_to;
    } catch {
      setStatus("error");
    }
  };

  const cancel = () => {
    const sep = redirectUri.includes("?") ? "&" : "?";
    window.location.href = `${redirectUri}${sep}error=access_denied&state=${encodeURIComponent(state)}`;
  };

  const signIn = () => {
    const next = `/oauth/consent?${params.toString()}`;
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  };

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-bg border border-border flex items-center justify-center">
            <Sparkles size={22} className="text-accent" />
          </div>
          <h1 className="text-lg font-semibold">{t("title", { app: appName })}</h1>
        </div>

        {status === "checking" && (
          <p className="mt-5 text-sm text-text-muted">{t("loading")}</p>
        )}

        {status === "invalid" && (
          <p className="mt-5 text-sm text-red-400">{t("invalid")}</p>
        )}

        {status === "unauth" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-text-muted">{t("signInRequired")}</p>
            <button
              type="button"
              onClick={signIn}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
            >
              {t("signInCta")}
            </button>
          </div>
        )}

        {(status === "ready" || status === "connecting" || status === "error") && (
          <div className="mt-5 space-y-5">
            <p className="text-sm text-text-muted">{t("body", { app: appName })}</p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-text">
                <Eye size={16} className="text-accent shrink-0 mt-0.5" />
                {t("scopeRead")}
              </li>
              {canWrite && (
                <li className="flex items-start gap-2.5 text-sm text-text">
                  <Pencil size={16} className="text-accent shrink-0 mt-0.5" />
                  {t("scopeWrite")}
                </li>
              )}
            </ul>
            <div className="flex items-start gap-2 rounded-lg border border-border bg-bg/50 px-3 py-2.5">
              <Lock size={14} className="text-text-muted shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted">{t("note")}</p>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400">{t("error")}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancel}
                disabled={status === "connecting"}
                className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text hover:bg-bg disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={allow}
                disabled={status === "connecting"}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {status === "connecting" ? t("connecting") : t("allow")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
