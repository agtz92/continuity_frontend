"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  ADMIN_SET_USER_IS_ADMIN,
  ADMIN_SET_USER_IS_BILLING_EXEMPT,
  ADMIN_SET_USER_PLAN,
  ADMIN_USERS_QUERY,
} from "@/lib/graphql";
import {
  nextSortState,
  sortRows,
  toSortableTime,
  type SortDir,
  type SortState,
  type SortValue,
} from "@/lib/tableSort";
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

/**
 * Columnas ordenables. `defaultDir` es la dirección del primer clic: ascendente
 * para texto (A→Z) y descendente para números, fechas y casillas (lo más alto,
 * lo más reciente y lo marcado primero, que es lo que uno busca al ordenar).
 */
const SORT_COLUMNS = [
  { key: "email", label: "Email", defaultDir: "asc" },
  { key: "plan", label: "Plan", defaultDir: "asc" },
  { key: "admin", label: "Admin", defaultDir: "desc" },
  { key: "exempt", label: "Exento", defaultDir: "desc" },
  { key: "created", label: "Creado", defaultDir: "desc" },
  { key: "lastActivity", label: "Última interacción", defaultDir: "desc" },
  { key: "projects", label: "Proyectos", defaultDir: "desc" },
  {
    key: "tasks",
    label: "Tareas (abiertas/hechas)",
    defaultDir: "desc",
    hint: "Ordena por tareas abiertas",
  },
  { key: "interactions", label: "Interacciones (30d)", defaultDir: "desc" },
] as const satisfies readonly {
  key: string;
  label: string;
  defaultDir: SortDir;
  hint?: string;
}[];

type SortKey = (typeof SORT_COLUMNS)[number]["key"];

/** Orden de los planes por "altura", no alfabético. */
const PLAN_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  studio: 2,
  admin: 3,
};

/** Valor comparable de una fila para cada columna. */
function userSortValue(u: AdminUserRow, key: SortKey): SortValue {
  switch (key) {
    case "email":
      return u.email ? u.email.toLowerCase() : null;
    case "plan":
      return PLAN_RANK[(u.plan || "").toLowerCase()] ?? 99;
    case "admin":
      return u.isAdmin;
    case "exempt":
      return u.isBillingExempt;
    case "created":
      return toSortableTime(u.createdAt);
    case "lastActivity":
      return toSortableTime(u.lastActivity);
    case "projects":
      return u.counts.projects;
    case "tasks":
      return u.counts.tasksOpen;
    case "interactions":
      return u.interactions30d;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

/** Encabezado clicable: muestra la flecha de la columna activa. */
function SortableTh({
  column,
  sort,
  onSort,
  className = "",
}: {
  column: (typeof SORT_COLUMNS)[number];
  sort: SortState<SortKey>;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort?.key === column.key;
  const dir = active ? sort.dir : null;
  const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ChevronsUpDown;
  return (
    <th
      scope="col"
      aria-sort={
        active ? (dir === "asc" ? "ascending" : "descending") : "none"
      }
      className={`px-4 py-2.5 font-semibold ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        title={
          "hint" in column && column.hint
            ? `${column.hint} · clic para cambiar el orden`
            : `Ordenar por ${column.label}`
        }
        className="group inline-flex items-center gap-1 uppercase tracking-wide text-left hover:text-text"
      >
        <span>{column.label}</span>
        <Icon
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 ${
            active
              ? "text-accent"
              : "text-text-muted opacity-0 transition-opacity group-hover:opacity-70"
          }`}
        />
      </button>
    </th>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [emailContains, setEmailContains] = useState("");
  const [plan, setPlan] = useState<string>("");
  const [adminsOnly, setAdminsOnly] = useState(false);
  const [sort, setSort] = useState<SortState<SortKey>>(null);
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

  const serverRows = useMemo(
    () => data?.adminUsers.users ?? [],
    [data?.adminUsers.users]
  );
  const rows = useMemo(
    () => sortRows(serverRows, sort, userSortValue),
    [serverRows, sort]
  );
  const hasNext = data?.adminUsers.hasNext ?? false;

  const handleSort = (key: SortKey) => {
    const column = SORT_COLUMNS.find((c) => c.key === key);
    setSort((prev) => nextSortState(prev, key, column?.defaultDir ?? "asc"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Usuarios</h1>
          <p className="mt-1 text-sm text-text-muted">
            Cuentas registradas en Supabase. Filtros y orden se aplican sobre
            la página actual.
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
        {/* En móvil no hay encabezados que clicar: selector + dirección. */}
        <div className="flex items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
            Ordenar
            <select
              value={sort?.key ?? ""}
              onChange={(e) => {
                const key = e.target.value as SortKey | "";
                if (!key) {
                  setSort(null);
                  return;
                }
                const column = SORT_COLUMNS.find((c) => c.key === key);
                setSort({ key, dir: column?.defaultDir ?? "asc" });
              }}
              className="min-w-0 flex-1 rounded border border-border bg-bg px-2 py-1.5 text-sm normal-case text-text outline-none focus:border-accent"
            >
              <option value="">Orden del servidor</option>
              {SORT_COLUMNS.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!sort}
            onClick={() =>
              setSort((prev) =>
                prev
                  ? { ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }
                  : prev
              )
            }
            aria-label={
              sort?.dir === "asc" ? "Orden ascendente" : "Orden descendente"
            }
            className="flex shrink-0 items-center gap-1 rounded border border-border bg-surface px-3 py-1.5 text-sm text-text disabled:opacity-50"
          >
            {sort?.dir === "asc" ? (
              <ArrowUp aria-hidden className="h-4 w-4" />
            ) : (
              <ArrowDown aria-hidden className="h-4 w-4" />
            )}
          </button>
        </div>
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
                    {formatDate(u.lastActivity)}
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
              {SORT_COLUMNS.map((column) => (
                <SortableTh
                  key={column.key}
                  column={column}
                  sort={sort}
                  onSort={handleSort}
                />
              ))}
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
                    {formatDate(u.lastActivity)}
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
