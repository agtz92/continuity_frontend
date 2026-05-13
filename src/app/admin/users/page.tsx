"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ADMIN_USERS_QUERY } from "@/lib/graphql";

type AdminUserRow = {
  userId: string;
  email: string;
  plan: string;
  isAdmin: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  lastActivity: string | null;
  counts: {
    projects: number;
    tasksOpen: number;
    tasksDone: number;
    ideas: number;
    notes: number;
  };
};

type AdminUsersData = {
  adminUsers: {
    users: AdminUserRow[];
    page: number;
    perPage: number;
    hasNext: boolean;
  };
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [emailContains, setEmailContains] = useState("");
  const [plan, setPlan] = useState<string>("");
  const [adminsOnly, setAdminsOnly] = useState(false);

  const { data, loading, error, refetch } = useQuery<AdminUsersData>(
    ADMIN_USERS_QUERY,
    {
      variables: {
        page,
        perPage: 25,
        emailContains: emailContains || null,
        plan: plan || null,
        adminsOnly,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const rows = data?.adminUsers.users ?? [];
  const hasNext = data?.adminUsers.hasNext ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Usuarios</h1>
          <p className="mt-1 text-sm text-text-muted">
            Cuentas registradas en Supabase. Filtros se aplican sobre la
            página actual.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
              Email contiene
            </label>
            <input
              value={emailContains}
              onChange={(e) => setEmailContains(e.target.value)}
              placeholder="ej. gmail.com"
              className="rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
              Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
            >
              <option value="">Todos</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="admin">Admin (tier)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={adminsOnly}
              onChange={(e) => setAdminsOnly(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Solo admins
          </label>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg"
          >
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold">Plan</th>
              <th className="px-4 py-2.5 font-semibold">Admin</th>
              <th className="px-4 py-2.5 font-semibold">Creado</th>
              <th className="px-4 py-2.5 font-semibold">Último ingreso</th>
              <th className="px-4 py-2.5 font-semibold">Proyectos</th>
              <th className="px-4 py-2.5 font-semibold">Tareas (abiertas/hechas)</th>
              <th className="px-4 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-text-muted">
                  Sin resultados en esta página.
                </td>
              </tr>
            )}
            {rows.map((u) => (
              <tr key={u.userId} className="hover:bg-bg/40">
                <td className="px-4 py-2.5 text-text">{u.email || "—"}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded bg-bg px-2 py-0.5 text-xs uppercase text-text-muted">
                    {u.plan}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {u.isAdmin ? (
                    <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                      sí
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {formatDate(u.lastSignInAt)}
                </td>
                <td className="px-4 py-2.5 text-text">{u.counts.projects}</td>
                <td className="px-4 py-2.5 text-text">
                  {u.counts.tasksOpen}/{u.counts.tasksDone}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/users/${u.userId}`}
                    className="text-accent hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div>Página {data?.adminUsers.page ?? page}</div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!hasNext || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
