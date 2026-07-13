"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_SET_USER_IS_ADMIN,
  ADMIN_SET_USER_IS_BILLING_EXEMPT,
  ADMIN_SET_USER_PLAN,
  ADMIN_USERS_QUERY,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type AdminUserRow = {
  userId: string;
  email: string;
  plan: string;
  isAdmin: boolean;
  isBillingExempt: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  lastActivity: string | null;
  interactions30d: number;
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

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "studio", label: "Studio" },
  { value: "admin", label: "Admin (staff)" },
];

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
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

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

  const markPending = (id: string, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const [setUserPlan] = useMutation(ADMIN_SET_USER_PLAN);
  const [setUserIsAdmin] = useMutation(ADMIN_SET_USER_IS_ADMIN);
  const [setUserIsBillingExempt] = useMutation(
    ADMIN_SET_USER_IS_BILLING_EXEMPT
  );

  const handlePlanChange = async (u: AdminUserRow, nextPlan: string) => {
    if (nextPlan === u.plan) return;
    if (
      !confirm(
        `Cambiar plan de ${u.email || u.userId} a "${nextPlan}"?`
      )
    ) {
      return;
    }
    markPending(u.userId, true);
    try {
      await setUserPlan({
        variables: { userId: u.userId, plan: nextPlan },
      });
      toast.success("Plan actualizado");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar plan");
    } finally {
      markPending(u.userId, false);
    }
  };

  const handleAdminToggle = async (u: AdminUserRow, nextIsAdmin: boolean) => {
    if (
      !confirm(
        nextIsAdmin
          ? `Otorgar privilegios admin a ${u.email || u.userId}?`
          : `Revocar privilegios admin de ${u.email || u.userId}?`
      )
    ) {
      return;
    }
    markPending(u.userId, true);
    try {
      await setUserIsAdmin({
        variables: { userId: u.userId, isAdmin: nextIsAdmin },
      });
      toast.success("Rol actualizado");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar rol");
    } finally {
      markPending(u.userId, false);
    }
  };

  const handleExemptToggle = async (
    u: AdminUserRow,
    nextExempt: boolean
  ) => {
    if (
      !confirm(
        nextExempt
          ? `Marcar a ${u.email || u.userId} como exento de pago?`
          : `Quitar la exención de pago de ${u.email || u.userId}?`
      )
    ) {
      return;
    }
    markPending(u.userId, true);
    try {
      await setUserIsBillingExempt({
        variables: { userId: u.userId, isBillingExempt: nextExempt },
      });
      toast.success("Exención de pago actualizada");
      await refetch();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Error al actualizar cortesía"
      );
    } finally {
      markPending(u.userId, false);
    }
  };

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
        <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
          <div className="min-w-0 flex-1 sm:flex-none">
            <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
              Email contiene
            </label>
            <input
              value={emailContains}
              onChange={(e) => setEmailContains(e.target.value)}
              placeholder="ej. gmail.com"
              className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent sm:w-auto"
            />
          </div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
              Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent sm:w-auto"
            >
              <option value="">Todos</option>
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
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

      {/* Tarjetas (móvil) */}
      <div className="space-y-3 md:hidden">
        {loading && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Cargando…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Sin resultados en esta página.
          </div>
        )}
        {rows.map((u) => {
          const busy = pendingIds.has(u.userId);
          return (
            <div
              key={u.userId}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-text">
                    {u.email || "—"}
                  </div>
                  <div className="mt-0.5 text-xs text-text-muted">
                    Creado {formatDate(u.createdAt)} · Última interacción{" "}
                    {formatDate(u.lastSignInAt)}
                  </div>
                </div>
                <Link
                  href={`/admin/users/${u.userId}`}
                  className="shrink-0 text-sm text-accent hover:underline"
                >
                  Ver
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-xs text-text-muted">
                  Plan
                  <select
                    value={u.plan}
                    disabled={busy}
                    onChange={(e) => handlePlanChange(u, e.target.value)}
                    className="rounded border border-border bg-bg px-2 py-1 text-xs uppercase text-text outline-none focus:border-accent disabled:opacity-50"
                  >
                    {PLAN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={u.isAdmin}
                    disabled={busy}
                    onChange={(e) => handleAdminToggle(u, e.target.checked)}
                    className="h-4 w-4 accent-accent disabled:opacity-50"
                  />
                  Admin
                </label>
                <label className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={u.isBillingExempt}
                    disabled={busy}
                    onChange={(e) => handleExemptToggle(u, e.target.checked)}
                    className="h-4 w-4 accent-accent disabled:opacity-50"
                  />
                  Exento
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                <span>
                  Proyectos:{" "}
                  <span className="text-text">{u.counts.projects}</span>
                </span>
                <span>
                  Tareas:{" "}
                  <span className="text-text">
                    {u.counts.tasksOpen}/{u.counts.tasksDone}
                  </span>{" "}
                  (abiertas/hechas)
                </span>
                <span>
                  Interacciones (30d):{" "}
                  <span className="text-text">{u.interactions30d}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla (escritorio) */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold">Plan</th>
              <th className="px-4 py-2.5 font-semibold">Admin</th>
              <th className="px-4 py-2.5 font-semibold">Exento</th>
              <th className="px-4 py-2.5 font-semibold">Creado</th>
              <th className="px-4 py-2.5 font-semibold">Última interacción</th>
              <th className="px-4 py-2.5 font-semibold">Proyectos</th>
              <th className="px-4 py-2.5 font-semibold">Tareas (abiertas/hechas)</th>
              <th className="px-4 py-2.5 font-semibold">Interacciones (30d)</th>
              <th className="px-4 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-text-muted">
                  Sin resultados en esta página.
                </td>
              </tr>
            )}
            {rows.map((u) => {
              const busy = pendingIds.has(u.userId);
              return (
                <tr key={u.userId} className="hover:bg-bg/40">
                  <td className="px-4 py-2.5 text-text">{u.email || "—"}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={u.plan}
                      disabled={busy}
                      onChange={(e) => handlePlanChange(u, e.target.value)}
                      className="rounded border border-border bg-bg px-2 py-1 text-xs uppercase text-text outline-none focus:border-accent disabled:opacity-50"
                    >
                      {PLAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={u.isAdmin}
                      disabled={busy}
                      onChange={(e) =>
                        handleAdminToggle(u, e.target.checked)
                      }
                      className="h-4 w-4 accent-accent disabled:opacity-50"
                      aria-label={`Admin ${u.email}`}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={u.isBillingExempt}
                      disabled={busy}
                      onChange={(e) =>
                        handleExemptToggle(u, e.target.checked)
                      }
                      className="h-4 w-4 accent-accent disabled:opacity-50"
                      aria-label={`Exento ${u.email}`}
                    />
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
                  <td className="px-4 py-2.5 text-text">{u.interactions30d}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/users/${u.userId}`}
                      className="text-accent hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
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
