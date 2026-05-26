"use client";

import { useQuery } from "@apollo/client";
import { ADMIN_SYSTEM_STATS_QUERY } from "@/lib/graphql";

type Stats = {
  totalUsers: number;
  totalAccounts: number;
  admins: number;
  dau: number;
  wau: number;
  mau: number;
  blogPostsPublished: number;
  blogPostsDraft: number;
  pagesPublished: number;
  pendingJobs: number;
  failedJobs: number;
  tasksOpen: number;
  tasksDone30d: number;
  ideasTotal: number;
  planCounts: { plan: string; count: number }[];
  jobStatusCounts: { status: string; count: number }[];
};

export default function StatsPage() {
  const { data, loading, error, refetch } = useQuery<{
    adminSystemStats: Stats;
  }>(ADMIN_SYSTEM_STATS_QUERY, { fetchPolicy: "cache-and-network" });
  const s = data?.adminSystemStats;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Estadísticas</h1>
          <p className="mt-1 text-sm text-text-muted">
            Métricas calculadas en tiempo real sobre los modelos locales.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg"
        >
          Refrescar
        </button>
      </div>

      {loading && !s && <div className="text-text-muted">Cargando…</div>}
      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error.message}
        </div>
      )}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <Stat label="Usuarios (Supabase)" value={s.totalUsers} />
            <Stat label="Cuentas (AccountProfile)" value={s.totalAccounts} />
            <Stat label="Administradores" value={s.admins} />
            <Stat label="DAU (24h)" value={s.dau} />
            <Stat label="WAU (7d)" value={s.wau} />
            <Stat label="MAU (30d)" value={s.mau} />
            <Stat label="Tareas abiertas" value={s.tasksOpen} />
            <Stat label="Tareas cerradas 30d" value={s.tasksDone30d} />
            <Stat label="Ideas totales" value={s.ideasTotal} />
            <Stat label="Posts publicados" value={s.blogPostsPublished} />
            <Stat label="Posts en borrador" value={s.blogPostsDraft} />
            <Stat label="Páginas publicadas" value={s.pagesPublished} />
            <Stat
              label="Jobs pendientes"
              value={s.pendingJobs}
              tone={s.pendingJobs > 0 ? "warn" : "neutral"}
            />
            <Stat
              label="Jobs fallidos"
              value={s.failedJobs}
              tone={s.failedJobs > 0 ? "bad" : "neutral"}
            />
          </div>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 text-xs uppercase text-text-muted">
                Distribución por plan
              </div>
              <ul className="space-y-1 text-sm">
                {s.planCounts.length === 0 && (
                  <li className="text-text-muted">Sin datos.</li>
                )}
                {s.planCounts.map((row) => (
                  <li key={row.plan} className="flex justify-between">
                    <span className="capitalize text-text">{row.plan}</span>
                    <span className="text-text">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 text-xs uppercase text-text-muted">
                Notificaciones por estado
              </div>
              <ul className="space-y-1 text-sm">
                {s.jobStatusCounts.length === 0 && (
                  <li className="text-text-muted">Sin notificaciones aún.</li>
                )}
                {s.jobStatusCounts.map((row) => (
                  <li key={row.status} className="flex justify-between">
                    <span className="capitalize text-text">{row.status}</span>
                    <span className="text-text">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warn" | "bad";
}) {
  const cls =
    tone === "bad"
      ? "text-red-400"
      : tone === "warn"
        ? "text-yellow-400"
        : "text-text";
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
