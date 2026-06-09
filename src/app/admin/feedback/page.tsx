"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_BUG_REPORTS_QUERY,
  ADMIN_BUG_REPORTS_UNREAD_COUNT,
  ADMIN_BUG_REPORT_SET_STATUS,
  ADMIN_BUG_REPORT_DELETE,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type BugReport = {
  id: string;
  userId: string;
  email: string;
  topic: string;
  message: string;
  platform: string;
  status: string;
  created: string;
};

type BugReportPage = {
  reports: BugReport[];
  page: number;
  perPage: number;
  hasNext: boolean;
};

const PER_PAGE = 50;

function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function statusChip(s: string): string {
  if (s === "new") return "bg-accent/15 text-accent";
  if (s === "read") return "bg-emerald-500/15 text-emerald-400";
  return "bg-bg text-text-muted"; // archived
}

function statusLabel(s: string): string {
  if (s === "new") return "Nuevo";
  if (s === "read") return "Leído";
  if (s === "archived") return "Archivado";
  return s;
}

export default function AdminFeedbackPage() {
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useQuery<{
    adminBugReports: BugReportPage;
  }>(ADMIN_BUG_REPORTS_QUERY, {
    variables: { page, perPage: PER_PAGE, status: filter || null },
    fetchPolicy: "cache-and-network",
  });

  const mutationOpts = {
    refetchQueries: [{ query: ADMIN_BUG_REPORTS_UNREAD_COUNT }],
    onError: (e: { message: string }) => toast.error(e.message),
  };

  const [setStatus] = useMutation(ADMIN_BUG_REPORT_SET_STATUS, {
    ...mutationOpts,
    onCompleted: () => {
      toast.success("Estado actualizado");
      refetch();
    },
  });
  const [deleteReport] = useMutation(ADMIN_BUG_REPORT_DELETE, {
    ...mutationOpts,
    onCompleted: () => {
      toast.success("Eliminado");
      refetch();
    },
  });

  const result = data?.adminBugReports;
  const rows = result?.reports ?? [];
  const hasNext = result?.hasNext ?? false;

  const onFilterChange = (v: string) => {
    setFilter(v);
    setPage(1);
  };

  const actions = (r: BugReport) => (
    <div className="flex flex-wrap justify-end gap-2 text-sm">
      {r.status === "new" && (
        <button
          type="button"
          onClick={() => setStatus({ variables: { id: r.id, status: "read" } })}
          className="text-text-muted hover:text-text"
        >
          Marcar leído
        </button>
      )}
      {r.status !== "archived" && (
        <button
          type="button"
          onClick={() =>
            setStatus({ variables: { id: r.id, status: "archived" } })
          }
          className="text-text-muted hover:text-text"
        >
          Archivar
        </button>
      )}
      {r.status === "archived" && (
        <button
          type="button"
          onClick={() => setStatus({ variables: { id: r.id, status: "new" } })}
          className="text-text-muted hover:text-text"
        >
          Reabrir
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (!confirm("¿Eliminar este reporte?")) return;
          deleteReport({ variables: { id: r.id } });
        }}
        className="text-red-500 hover:underline"
      >
        Eliminar
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Buzón de feedback</h1>
          <p className="mt-1 text-sm text-text-muted">
            Reportes de bugs enviados por usuarios desde la web y la app. Canal
            de un solo sentido — no hay respuestas.
          </p>
        </div>
        <div className="min-w-0">
          <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
            Estado
          </label>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent sm:w-auto"
          >
            <option value="">Todos</option>
            <option value="new">Nuevos</option>
            <option value="read">Leídos</option>
            <option value="archived">Archivados</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error.message}
        </div>
      )}

      {/* Tarjetas (móvil) */}
      <div className="space-y-3 md:hidden">
        {loading && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Cargando…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            No hay reportes.
          </div>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-text">{r.topic}</div>
                <div className="mt-0.5 truncate text-xs text-text-muted">
                  {r.email || r.userId}
                </div>
              </div>
              <span
                className={
                  "shrink-0 rounded px-2 py-0.5 text-xs uppercase " +
                  statusChip(r.status)
                }
              >
                {statusLabel(r.status)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-text">
              {r.message}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-text-muted">
              <span>
                {r.platform === "app" ? "App" : "Web"} · {formatDate(r.created)}
              </span>
            </div>
            <div className="mt-3">{actions(r)}</div>
          </div>
        ))}
      </div>

      {/* Tabla (escritorio) */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Tema</th>
              <th className="px-4 py-2.5 font-semibold">Mensaje</th>
              <th className="px-4 py-2.5 font-semibold">Usuario</th>
              <th className="px-4 py-2.5 font-semibold">Origen</th>
              <th className="px-4 py-2.5 font-semibold">Fecha</th>
              <th className="px-4 py-2.5 font-semibold">Estado</th>
              <th className="px-4 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  No hay reportes.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="align-top hover:bg-bg/40">
                <td className="px-4 py-2.5 font-medium text-text">{r.topic}</td>
                <td className="px-4 py-2.5 text-text-muted">
                  <div className="max-w-md whitespace-pre-wrap">{r.message}</div>
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {r.email || (
                    <span className="font-mono text-xs">{r.userId}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {r.platform === "app" ? "App" : "Web"}
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {formatDate(r.created)}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      "rounded px-2 py-0.5 text-xs uppercase " +
                      statusChip(r.status)
                    }
                  >
                    {statusLabel(r.status)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">{actions(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {(page > 1 || hasNext) && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-border px-3 py-1.5 text-text-muted hover:text-text disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-text-muted">Página {page}</span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-border px-3 py-1.5 text-text-muted hover:text-text disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
