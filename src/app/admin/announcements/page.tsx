"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_ANNOUNCEMENTS_QUERY,
  ADMIN_ANNOUNCEMENT_DELETE,
  ADMIN_ANNOUNCEMENT_SET_STATUS,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type Announcement = {
  id: string;
  title: string;
  body: string;
  severity: string;
  status: string;
  audiencePlans: string[];
  audienceUserIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  dismissible: boolean;
  ctaLabel: string;
  ctaUrl: string;
  createdAt: string;
  updatedAt: string;
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function audienceLabel(a: Announcement): string {
  if (a.audiencePlans.length === 0 && a.audienceUserIds.length === 0) {
    return "Todos";
  }
  const parts: string[] = [];
  if (a.audiencePlans.length > 0) parts.push(`planes: ${a.audiencePlans.join(", ")}`);
  if (a.audienceUserIds.length > 0)
    parts.push(`${a.audienceUserIds.length} usuario(s)`);
  return parts.join(" · ");
}

export default function AdminAnnouncementsPage() {
  const [filter, setFilter] = useState<string>("");

  const { data, loading, error, refetch } = useQuery<{
    adminAnnouncements: Announcement[];
  }>(ADMIN_ANNOUNCEMENTS_QUERY, {
    variables: { status: filter || null },
    fetchPolicy: "cache-and-network",
  });

  const [setStatus] = useMutation(ADMIN_ANNOUNCEMENT_SET_STATUS, {
    onCompleted: () => {
      toast.success("Estado actualizado");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [deleteAnnouncement] = useMutation(ADMIN_ANNOUNCEMENT_DELETE, {
    onCompleted: () => {
      toast.success("Eliminado");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = data?.adminAnnouncements ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Anuncios</h1>
          <p className="mt-1 text-sm text-text-muted">
            Banners in-app mostrados en el dashboard del usuario.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
          <div className="min-w-0 flex-1 sm:flex-none">
            <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
              Estado
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent sm:w-auto"
            >
              <option value="">Todos</option>
              <option value="draft">Borradores</option>
              <option value="published">Publicados</option>
              <option value="archived">Archivados</option>
            </select>
          </div>
          <Link
            href="/admin/announcements/new"
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            + Nuevo anuncio
          </Link>
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
            No hay anuncios.
          </div>
        )}
        {rows.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-text">{a.title}</div>
                {a.body && (
                  <div className="mt-0.5 truncate text-xs text-text-muted">
                    {a.body}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm">
                <Link
                  href={`/admin/announcements/${a.id}`}
                  className="text-accent hover:underline"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`Eliminar "${a.title}"?`)) return;
                    deleteAnnouncement({ variables: { id: a.id } });
                  }}
                  className="text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={
                  "rounded px-2 py-0.5 text-xs uppercase " +
                  severityChip(a.severity)
                }
              >
                {a.severity}
              </span>
              <span
                className={
                  "rounded px-2 py-0.5 text-xs uppercase " +
                  statusChip(a.status)
                }
              >
                {a.status}
              </span>
              {a.status !== "published" && (
                <button
                  type="button"
                  onClick={() =>
                    setStatus({
                      variables: { id: a.id, status: "published" },
                    })
                  }
                  className="text-xs text-text-muted hover:text-text"
                >
                  Publicar
                </button>
              )}
              {a.status === "published" && (
                <button
                  type="button"
                  onClick={() =>
                    setStatus({
                      variables: { id: a.id, status: "archived" },
                    })
                  }
                  className="text-xs text-text-muted hover:text-text"
                >
                  Archivar
                </button>
              )}
            </div>

            <div className="mt-3 space-y-1 text-xs text-text-muted">
              <div>Audiencia: {audienceLabel(a)}</div>
              <div>
                Activo {formatDate(a.startsAt)} → {formatDate(a.endsAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla (escritorio) */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Título</th>
              <th className="px-4 py-2.5 font-semibold">Severidad</th>
              <th className="px-4 py-2.5 font-semibold">Estado</th>
              <th className="px-4 py-2.5 font-semibold">Audiencia</th>
              <th className="px-4 py-2.5 font-semibold">Activo desde</th>
              <th className="px-4 py-2.5 font-semibold">Hasta</th>
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
                  No hay anuncios.
                </td>
              </tr>
            )}
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-bg/40">
                <td className="px-4 py-2.5 text-text">
                  <div className="font-medium">{a.title}</div>
                  {a.body && (
                    <div className="text-xs text-text-muted line-clamp-1">
                      {a.body}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      "rounded px-2 py-0.5 text-xs uppercase " +
                      severityChip(a.severity)
                    }
                  >
                    {a.severity}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      "rounded px-2 py-0.5 text-xs uppercase " +
                      statusChip(a.status)
                    }
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {audienceLabel(a)}
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {formatDate(a.startsAt)}
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {formatDate(a.endsAt)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/announcements/${a.id}`}
                      className="text-accent hover:underline"
                    >
                      Editar
                    </Link>
                    {a.status !== "published" && (
                      <button
                        type="button"
                        onClick={() =>
                          setStatus({
                            variables: { id: a.id, status: "published" },
                          })
                        }
                        className="text-text-muted hover:text-text"
                      >
                        Publicar
                      </button>
                    )}
                    {a.status === "published" && (
                      <button
                        type="button"
                        onClick={() =>
                          setStatus({
                            variables: { id: a.id, status: "archived" },
                          })
                        }
                        className="text-text-muted hover:text-text"
                      >
                        Archivar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Eliminar "${a.title}"?`)) return;
                        deleteAnnouncement({ variables: { id: a.id } });
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function severityChip(s: string): string {
  if (s === "error") return "bg-red-500/15 text-red-400";
  if (s === "warn") return "bg-amber-500/15 text-amber-400";
  return "bg-accent/15 text-accent";
}

function statusChip(s: string): string {
  if (s === "published")
    return "bg-emerald-500/15 text-emerald-400";
  if (s === "archived") return "bg-bg text-text-muted";
  return "bg-bg text-text-muted";
}
