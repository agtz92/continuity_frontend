"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { ListTodo, ChevronRight, Sparkles, Calendar } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Meta } from "@/components/ui/Meta";
import {
  GOOGLE_TASKS_CONNECTION_QUERY,
  MCP_CONNECTIONS_QUERY,
} from "@/lib/graphql";

type ConnectionData = {
  googleTasksConnection: {
    connected: boolean;
    email: string | null;
  };
};

type McpConnectionsData = {
  mcpConnections: { clientId: string }[];
};

export default function PluginsSettingsPage() {
  const t = useTranslations("settings.plugins");
  const { data } = useQuery<ConnectionData>(GOOGLE_TASKS_CONNECTION_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const connected = !!data?.googleTasksConnection?.connected;

  const { data: mcpData } = useQuery<McpConnectionsData>(MCP_CONNECTIONS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const claudeConnected = (mcpData?.mcpConnections?.length ?? 0) > 0;

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      {/* Filas con filete, no tarjetas: tres integraciones en tres cajas con
          sombra se leen como oferta de marketing. Lo único que hace falta saber
          aquí es si están conectadas (S20). */}
      <section className="divide-y divide-line-08 border-y border-line-08">
        <PluginRow
          href="/settings/plugins/calendar"
          icon={<Calendar size={18} />}
          name={t("calendar.name")}
          description={t("calendar.shortDescription")}
          statusLabel={t("calendar.statusAvailable")}
          connected={false}
        />
        <PluginRow
          href="/settings/plugins/google-tasks"
          icon={<ListTodo size={18} />}
          name={t("googleTasks.name")}
          description={t("googleTasks.shortDescription")}
          statusLabel={connected ? t("statusConnected") : t("statusNotConnected")}
          connected={connected}
        />
        <PluginRow
          href="/settings/plugins/claude"
          icon={<Sparkles size={18} />}
          name={t("claude.name")}
          description={t("claude.shortDescription")}
          statusLabel={
            claudeConnected
              ? t("statusConnected")
              : t("claude.statusNotConnected")
          }
          connected={claudeConnected}
        />
      </section>
    </SettingsShell>
  );
}

function PluginRow({
  href,
  icon,
  name,
  description,
  statusLabel,
  connected,
}: {
  href: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  statusLabel: string;
  connected: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-3 hover:bg-line-04 transition-colors duration-150 ease-out group"
    >
      <span className="shrink-0 text-text-4">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-text">{name}</span>
        <span className="block text-xs text-text-4 mt-0.5 truncate">
          {description}
        </span>
      </span>
      {/* Conectado o no, dicho con un punto lleno o hueco: se lee en escala de
          grises y no necesita pastilla. */}
      <span className="flex items-center gap-1.5 shrink-0">
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-closed" : "shadow-[inset_0_0_0_1px_var(--line-34)]"
          }`}
        />
        <Meta variant="cintillo" tone={connected ? "muted" : "faint"}>
          {statusLabel}
        </Meta>
      </span>
      <ChevronRight
        size={16}
        className="text-text-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
      />
    </Link>
  );
}
