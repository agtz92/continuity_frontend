"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { ArrowLeft, ListTodo, ExternalLink } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { toast } from "@/lib/toast";
import {
  DASHBOARD_QUERY,
  DISCONNECT_GOOGLE_TASKS,
  GOOGLE_TASKS_AUTH_URL,
  GOOGLE_TASKS_CONNECTION_QUERY,
  GOOGLE_TASK_LISTS_QUERY,
  IMPORT_GOOGLE_TASKS,
} from "@/lib/graphql";

type Connection = {
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
};

type TaskList = { id: string; title: string };

type DashboardProjects = {
  dashboard: {
    projects: { id: string; name: string }[];
  };
};

type MappingChoice =
  | { kind: "none" }
  | { kind: "existing"; projectId: string }
  | { kind: "new"; name: string };

export default function GoogleTasksPluginPage() {
  const t = useTranslations("settings.plugins.googleTasks");
  const searchParams = useSearchParams();
  const router = useRouter();

  const connectionQuery = useQuery<{ googleTasksConnection: Connection }>(
    GOOGLE_TASKS_CONNECTION_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const connection = connectionQuery.data?.googleTasksConnection;
  const connected = !!connection?.connected;

  const listsQuery = useQuery<{ googleTaskLists: TaskList[] }>(
    GOOGLE_TASK_LISTS_QUERY,
    { skip: !connected, fetchPolicy: "cache-and-network" },
  );
  const projectsQuery = useQuery<DashboardProjects>(DASHBOARD_QUERY, {
    skip: !connected,
    fetchPolicy: "cache-first",
  });
  const projects = projectsQuery.data?.dashboard?.projects ?? [];

  const [choices, setChoices] = useState<Record<string, MappingChoice>>({});

  useEffect(() => {
    const status = searchParams.get("google_connected");
    const err = searchParams.get("google_error");
    if (status) {
      toast.success(t("connectedAs", { email: connection?.email ?? "Google" }));
      connectionQuery.refetch();
      router.replace("/settings/plugins/google-tasks");
    } else if (err) {
      toast.error(t("errorConnect", { error: err }));
      router.replace("/settings/plugins/google-tasks");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const lists = listsQuery.data?.googleTaskLists ?? [];

  const [authUrlMutation, { loading: connecting }] = useMutation<{
    googleTasksAuthUrl: string;
  }>(GOOGLE_TASKS_AUTH_URL);

  const handleConnect = async () => {
    try {
      const res = await authUrlMutation({
        variables: { returnTo: "/settings/plugins/google-tasks" },
      });
      const url = res.data?.googleTasksAuthUrl;
      if (url) {
        window.location.href = url;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(t("errorConnect", { error: msg }));
    }
  };

  const [importMutation, { loading: importing }] = useMutation(
    IMPORT_GOOGLE_TASKS,
    {
      refetchQueries: [{ query: DASHBOARD_QUERY }],
      awaitRefetchQueries: true,
    },
  );

  const [disconnectMutation, { loading: disconnecting }] = useMutation(
    DISCONNECT_GOOGLE_TASKS,
    {
      refetchQueries: [{ query: GOOGLE_TASKS_CONNECTION_QUERY }],
      awaitRefetchQueries: true,
    },
  );

  const canImport = useMemo(() => {
    if (!lists.length) return false;
    return lists.some((l) => {
      const c = choices[l.id];
      if (!c) return false;
      if (c.kind === "existing") return true;
      if (c.kind === "new") return c.name.trim().length > 0;
      return c.kind === "none"; // selecting "no project" is a valid choice too
    });
  }, [lists, choices]);

  const handleImport = async () => {
    const mappings = lists
      .map((l) => {
        const c = choices[l.id];
        if (!c) return null;
        if (c.kind === "existing") {
          return { googleListId: l.id, projectId: c.projectId };
        }
        if (c.kind === "new") {
          const name = c.name.trim();
          if (!name) return null;
          return { googleListId: l.id, newProjectName: name };
        }
        return { googleListId: l.id };
      })
      .filter(Boolean);
    if (mappings.length === 0) return;
    try {
      const res = await importMutation({ variables: { mappings } });
      const r = res.data?.importGoogleTasks;
      if (r?.createdProjects?.length) {
        toast.success(
          t("importSuccessWithProjects", {
            imported: r.imported,
            projects: r.createdProjects.join(", "),
          }),
        );
      } else {
        toast.success(
          t("importSuccess", {
            imported: r?.imported ?? 0,
            skipped: r?.skipped ?? 0,
          }),
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(t("errorImport", { error: msg }));
    }
  };

  const handleDisconnect = async () => {
    await disconnectMutation();
    setChoices({});
  };

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
            <ListTodo size={22} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text">{t("title")}</div>
            <div className="text-xs text-text-muted mt-0.5">
              {connected && connection?.email
                ? t("connectedAs", { email: connection.email })
                : t("notConnectedBody")}
            </div>
          </div>
          {connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3 py-1.5 bg-border hover:opacity-80 rounded-lg text-sm text-text transition-opacity disabled:opacity-50"
            >
              {t("disconnectButton")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-bg rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <ExternalLink size={14} />
              {t("connectButton")}
            </button>
          )}
        </div>
      </section>

      {connected && (
        <section className="bg-surface/50 border border-border rounded-xl p-5 mt-4 space-y-4">
          {listsQuery.loading && !listsQuery.data ? (
            <div className="text-sm text-text-muted">{t("loadingLists")}</div>
          ) : lists.length === 0 ? (
            <div className="text-sm text-text-muted">{t("noLists")}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                <div>{t("listColumn")}</div>
                <div>{t("projectColumn")}</div>
              </div>
              <div className="space-y-3">
                {lists.map((l) => (
                  <MappingRow
                    key={l.id}
                    list={l}
                    projects={projects}
                    choice={choices[l.id]}
                    onChange={(c) =>
                      setChoices((prev) => ({ ...prev, [l.id]: c }))
                    }
                  />
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!canImport || importing}
                  className="px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {importing ? t("importing") : t("importButton")}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </SettingsShell>
  );
}

function MappingRow({
  list,
  projects,
  choice,
  onChange,
}: {
  list: TaskList;
  projects: { id: string; name: string }[];
  choice: MappingChoice | undefined;
  onChange: (c: MappingChoice) => void;
}) {
  const t = useTranslations("settings.plugins.googleTasks");

  const value = !choice
    ? ""
    : choice.kind === "none"
      ? "__none__"
      : choice.kind === "existing"
        ? `existing:${choice.projectId}`
        : "__new__";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3 items-start">
      <div className="text-sm text-text pt-2">{list.title}</div>
      <div className="space-y-2">
        <select
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__none__") onChange({ kind: "none" });
            else if (v === "__new__") onChange({ kind: "new", name: list.title });
            else if (v.startsWith("existing:"))
              onChange({ kind: "existing", projectId: v.slice("existing:".length) });
          }}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
        >
          <option value="" disabled>
            —
          </option>
          <option value="__none__">{t("projectNone")}</option>
          {projects.length > 0 && (
            <optgroup label={t("projectExisting")}>
              {projects.map((p) => (
                <option key={p.id} value={`existing:${p.id}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
          <option value="__new__">
            {t("projectNew", { name: list.title })}
          </option>
        </select>
        {choice?.kind === "new" && (
          <input
            type="text"
            value={choice.name}
            onChange={(e) => onChange({ kind: "new", name: e.target.value })}
            placeholder={t("newProjectPlaceholder")}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
            autoFocus
          />
        )}
      </div>
    </div>
  );
}
