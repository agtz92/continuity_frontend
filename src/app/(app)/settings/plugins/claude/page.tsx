"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { ArrowLeft, Sparkles, Copy, Lock, Trash2 } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { assistantBaseUrl } from "@/lib/assistantApi";
import {
  MCP_CONNECTIONS_QUERY,
  REVOKE_MCP_CONNECTION,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

// The remote MCP connector lives on the same backend as the assistant.
const CONNECTOR_URL = `${assistantBaseUrl}/mcp/`;

type McpConnection = {
  clientId: string;
  clientName: string;
  connectedAt: string | null;
};

export default function ClaudePluginPage() {
  const t = useTranslations("settings.plugins.claude");

  const { data, refetch } = useQuery<{ mcpConnections: McpConnection[] }>(
    MCP_CONNECTIONS_QUERY,
    { fetchPolicy: "cache-and-network" }
  );
  const connections = data?.mcpConnections ?? [];
  const connected = connections.length > 0;

  const [revoke, { loading: revoking }] = useMutation(REVOKE_MCP_CONNECTION, {
    onCompleted: () => {
      toast.success(t("disconnected"));
      refetch();
    },
    onError: () => toast.error(t("disconnectError")),
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONNECTOR_URL);
      toast.success(t("copied"));
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return "";
    }
  };

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <Link
        href="/settings/plugins"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text mb-4 text-sm group"
      >
        <ArrowLeft
          size={14}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Plugins
      </Link>

      <section className="bg-surface/50 border border-border rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
            <Sparkles size={22} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text">{t("name")}</div>
            <div className="text-xs text-text-muted mt-0.5">
              {t("shortDescription")}
            </div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${
              connected
                ? "border-accent/50 text-accent bg-accent/10"
                : "border-border text-text-muted"
            }`}
          >
            {connected ? t("statusConnected") : t("statusNotConnected")}
          </span>
        </div>
      </section>

      {connected && (
        <section className="bg-surface/50 border border-border rounded-xl p-5 mt-4 space-y-3">
          <h2 className="text-sm font-semibold text-text">
            {t("connectionsTitle")}
          </h2>
          <ul className="space-y-2">
            {connections.map((c) => (
              <li
                key={c.clientId}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text truncate">
                    {c.clientName || "Claude"}
                  </div>
                  {c.connectedAt && (
                    <div className="text-xs text-text-muted mt-0.5">
                      {t("connectedOn", { date: formatDate(c.connectedAt) })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => revoke({ variables: { clientId: c.clientId } })}
                  disabled={revoking}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-text hover:bg-bg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {t("disconnect")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-surface/50 border border-border rounded-xl p-5 mt-4 space-y-4">
        <h2 className="text-sm font-semibold text-text">{t("howToTitle")}</h2>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-text-muted">
              <span className="shrink-0 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[11px] font-semibold text-text">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
            {t("urlLabel")}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text font-mono">
              {CONNECTOR_URL}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-border hover:opacity-80 rounded-lg text-sm text-text transition-opacity shrink-0"
            >
              <Copy size={14} />
              {t("copyButton")}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface/50 border border-border rounded-xl p-5 mt-4">
        <div className="flex items-start gap-3">
          <Lock size={16} className="text-text-muted shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-text">
              {t("privacyTitle")}
            </div>
            <p className="text-xs text-text-muted mt-1">{t("privacyNote")}</p>
          </div>
        </div>
      </section>
    </SettingsShell>
  );
}
