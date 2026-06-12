"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_NOTIFICATION_JOBS_QUERY,
  ADMIN_NOTIFICATION_JOB_RETRY,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type Job = {
  id: string;
  userId: string;
  channel: string;
  kind: string;
  dedupeKey: string;
  body: string;
  scheduledFor: string | null;
  status: string;
  attempts: number;
  externalMessageId: string;
  error: string;
  created: string;
  sentAt: string | null;
};

type Data = {
  adminNotificationJobs: {
    jobs: Job[];
    page: number;
    perPage: number;
    hasNext: boolean;
  };
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-bg text-text-muted",
  sent: "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-accent",
  failed: "bg-red-500/15 text-red-400",
  skipped: "bg-bg text-text-muted opacity-70",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [kind, setKind] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<Data>(
    ADMIN_NOTIFICATION_JOBS_QUERY,
    {
      variables: {
        page,
        perPage: 50,
        status: status || null,
        channel: channel || null,
        kind: kind || null,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const [retry, { loading: retrying }] = useMutation(
    ADMIN_NOTIFICATION_JOB_RETRY,
    {
      onCompleted: () => {
        toast.success("Reintento programado");
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );

  const jobs = data?.adminNotificationJobs.jobs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Jobs de notificación</h1>
          <p className="mt-1 text-sm text-text-muted">
            Outbox de Telegram/WhatsApp. Reintentar repone el job en pending para el próximo cron.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full min-w-0 flex-1 rounded border border-border bg-bg px-3 py-1.5 text-sm text-text sm:w-auto sm:flex-none"
          >
            <option value="">Cualquier estado</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full min-w-0 flex-1 rounded border border-border bg-bg px-3 py-1.5 text-sm text-text sm:w-auto sm:flex-none"
          >
            <option value="">Todos los canales</option>
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full min-w-0 flex-1 rounded border border-border bg-bg px-3 py-1.5 text-sm text-text sm:w-auto sm:flex-none"
          >
            <option value="">Cualquier tipo</option>
            <option value="weekly_digest">Weekly digest</option>
            <option value="daily_digest">Daily digest</option>
            <option value="sleeping_alert">Sleeping alert</option>
            <option value="due_reminder">Due reminder</option>
            <option value="manual">Manual</option>
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            className="w-full rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg sm:w-auto"
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* Tarjetas (móvil) */}
      <div className="space-y-3 md:hidden">
        {loading && jobs.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Cargando…
          </div>
        )}
        {!loading && jobs.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            No hay jobs con esos filtros.
          </div>
        )}
        {jobs.map((j) => {
          const isOpen = expanded === j.id;
          return (
            <div
              key={j.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs uppercase ${STATUS_COLOR[j.status] ?? "bg-bg text-text-muted"}`}
                  >
                    {j.status}
                  </span>
                  <div className="mt-1 text-text">{j.kind}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : j.id)}
                    className="text-accent hover:underline"
                  >
                    {isOpen ? "Ocultar" : "Ver"}
                  </button>
                  {(j.status === "failed" || j.status === "skipped") && (
                    <button
                      type="button"
                      disabled={retrying}
                      onClick={() => retry({ variables: { id: j.id } })}
                      className="text-accent hover:underline disabled:opacity-50"
                    >
                      Reintentar
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 text-xs text-text-muted">
                Canal <span className="capitalize">{j.channel}</span> · Usuario{" "}
                <span className="font-mono">{j.userId.slice(0, 8)}…</span> ·
                Intentos {j.attempts}
              </div>
              <div className="text-xs text-text-muted">
                Creado {formatDate(j.created)} · Enviado{" "}
                {formatDate(j.sentAt)}
              </div>

              {isOpen && (
                <div className="mt-3 border-t border-border pt-3 text-xs">
                  <Detail label="dedupe_key" value={j.dedupeKey} mono />
                  <Detail
                    label="scheduled_for"
                    value={formatDate(j.scheduledFor)}
                  />
                  <Detail
                    label="external_message_id"
                    value={j.externalMessageId || "—"}
                    mono
                  />
                  {j.error && (
                    <Detail label="error" value={j.error} tone="bad" />
                  )}
                  <div className="mt-3">
                    <div className="text-text-muted">body</div>
                    <pre className="mt-1 whitespace-pre-wrap rounded bg-bg p-3 text-xs text-text">
                      {j.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tabla (escritorio) */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Estado</th>
              <th className="px-3 py-2 font-semibold">Canal</th>
              <th className="px-3 py-2 font-semibold">Tipo</th>
              <th className="px-3 py-2 font-semibold">Usuario</th>
              <th className="px-3 py-2 font-semibold">Intentos</th>
              <th className="px-3 py-2 font-semibold">Creado</th>
              <th className="px-3 py-2 font-semibold">Enviado</th>
              <th className="px-3 py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-text-muted">
                  No hay jobs con esos filtros.
                </td>
              </tr>
            )}
            {jobs.map((j) => {
              const isOpen = expanded === j.id;
              return (
                <Fragment key={j.id}>
                  <tr className="hover:bg-bg/40">
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase ${STATUS_COLOR[j.status] ?? "bg-bg text-text-muted"}`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-text capitalize">
                      {j.channel}
                    </td>
                    <td className="px-3 py-2 text-text">{j.kind}</td>
                    <td className="px-3 py-2 font-mono text-xs text-text-muted">
                      {j.userId.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2 text-text">{j.attempts}</td>
                    <td className="px-3 py-2 text-text-muted">
                      {formatDate(j.created)}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {formatDate(j.sentAt)}
                    </td>
                    <td className="space-x-2 px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : j.id)}
                        className="text-accent hover:underline"
                      >
                        {isOpen ? "Ocultar" : "Ver"}
                      </button>
                      {(j.status === "failed" || j.status === "skipped") && (
                        <button
                          type="button"
                          disabled={retrying}
                          onClick={() => retry({ variables: { id: j.id } })}
                          className="text-accent hover:underline disabled:opacity-50"
                        >
                          Reintentar
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-bg/30">
                      <td colSpan={8} className="px-4 py-3 text-xs">
                        <Detail label="dedupe_key" value={j.dedupeKey} mono />
                        <Detail
                          label="scheduled_for"
                          value={formatDate(j.scheduledFor)}
                        />
                        <Detail
                          label="external_message_id"
                          value={j.externalMessageId || "—"}
                          mono
                        />
                        {j.error && (
                          <Detail label="error" value={j.error} tone="bad" />
                        )}
                        <div className="mt-3">
                          <div className="text-text-muted">body</div>
                          <pre className="mt-1 whitespace-pre-wrap rounded bg-surface p-3 text-xs text-text">
                            {j.body}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div>Página {data?.adminNotificationJobs.page ?? page}</div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-border px-3 py-1 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!data?.adminNotificationJobs.hasNext || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-border px-3 py-1 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

import { Fragment } from "react";

function Detail({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "bad";
}) {
  return (
    <div className="flex gap-3">
      <div className="w-40 shrink-0 text-text-muted">{label}</div>
      <div
        className={`break-all ${mono ? "font-mono" : ""} ${
          tone === "bad" ? "text-red-400" : "text-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
