"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { ADMIN_AUDIT_LOG_QUERY } from "@/lib/graphql";

type Entry = {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  created: string;
};

type Data = {
  adminAuditLog: {
    entries: Entry[];
    page: number;
    perPage: number;
    hasNext: boolean;
  };
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<Data>(ADMIN_AUDIT_LOG_QUERY, {
    variables: {
      page,
      perPage: 50,
      actionContains: actionFilter || null,
    },
    fetchPolicy: "cache-and-network",
  });

  const entries = data?.adminAuditLog.entries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Audit log</h1>
          <p className="mt-1 text-sm text-text-muted">
            Toda acción administrativa queda registrada acá.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <input
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="filtrar por acción (ej. user.)"
            className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text sm:w-auto"
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg"
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* Tarjetas (móvil) */}
      <div className="space-y-3 md:hidden">
        {loading && entries.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Cargando…
          </div>
        )}
        {!loading && entries.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Sin entradas todavía.
          </div>
        )}
        {entries.map((e) => {
          const isOpen = expanded === e.id;
          return (
            <div
              key={e.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm font-medium text-text">
                    {e.action}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  className="shrink-0 text-sm text-accent hover:underline"
                >
                  {isOpen ? "Ocultar" : "Ver"}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                <span>{formatDate(e.created)}</span>
                <span>
                  Actor{" "}
                  <span className="font-mono text-text">
                    {e.actorUserId.slice(0, 8)}…
                  </span>
                </span>
                {e.targetType && (
                  <span>
                    Objetivo{" "}
                    <span className="text-text">{e.targetType}</span>
                    {e.targetId && (
                      <span className="ml-1 font-mono">
                        {e.targetId.length > 16
                          ? `${e.targetId.slice(0, 8)}…`
                          : e.targetId}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {isOpen && (
                <div className="mt-3 border-t border-border pt-3">
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-bg p-3 text-xs text-text">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
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
              <th className="px-3 py-2 font-semibold">Cuándo</th>
              <th className="px-3 py-2 font-semibold">Actor</th>
              <th className="px-3 py-2 font-semibold">Acción</th>
              <th className="px-3 py-2 font-semibold">Objetivo</th>
              <th className="px-3 py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-text-muted">
                  Sin entradas todavía.
                </td>
              </tr>
            )}
            {entries.map((e) => {
              const isOpen = expanded === e.id;
              return (
                <Fragment key={e.id}>
                  <tr className="hover:bg-bg/40">
                    <td className="px-3 py-2 text-text-muted">
                      {formatDate(e.created)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-text-muted">
                      {e.actorUserId.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-text">
                      {e.action}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {e.targetType && (
                        <>
                          <span className="text-text">{e.targetType}</span>
                          {e.targetId && (
                            <span className="ml-1 font-mono text-xs">
                              {e.targetId.length > 16
                                ? `${e.targetId.slice(0, 8)}…`
                                : e.targetId}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : e.id)}
                        className="text-accent hover:underline"
                      >
                        {isOpen ? "Ocultar" : "Ver"}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-bg/30">
                      <td colSpan={5} className="px-4 py-3">
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-surface p-3 text-xs text-text">
                          {JSON.stringify(e.payload, null, 2)}
                        </pre>
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
        <div>Página {data?.adminAuditLog.page ?? page}</div>
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
            disabled={!data?.adminAuditLog.hasNext || loading}
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
