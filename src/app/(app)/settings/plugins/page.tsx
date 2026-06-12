"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { ListTodo, ChevronRight } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { GOOGLE_TASKS_CONNECTION_QUERY } from "@/lib/graphql";

type ConnectionData = {
  googleTasksConnection: {
    connected: boolean;
    email: string | null;
  };
};

export default function PluginsSettingsPage() {
  const t = useTranslations("settings.plugins");
  const { data } = useQuery<ConnectionData>(GOOGLE_TASKS_CONNECTION_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const connected = !!data?.googleTasksConnection?.connected;

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <section className="space-y-3">
        <PluginCard
          href="/settings/plugins/google-tasks"
          icon={<ListTodo size={22} className="text-accent" />}
          name={t("googleTasks.name")}
          description={t("googleTasks.shortDescription")}
          statusLabel={connected ? t("statusConnected") : t("statusNotConnected")}
          connected={connected}
        />
      </section>
    </SettingsShell>
  );
}

function PluginCard({
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
      className="flex items-center gap-4 bg-surface/50 border border-border rounded-xl p-4 hover:bg-surface transition-colors group"
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text">{name}</div>
        <div className="text-xs text-text-muted mt-0.5 truncate">
          {description}
        </div>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${
          connected
            ? "border-accent/50 text-accent bg-accent/10"
            : "border-border text-text-muted"
        }`}
      >
        {statusLabel}
      </span>
      <ChevronRight
        size={16}
        className="text-text-muted transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
