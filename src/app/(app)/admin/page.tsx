"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { ADMIN_SYSTEM_STATS_QUERY } from "@/lib/graphql";
import { ChartCard, DonutChart, Kpi, PlanPill, Shortcut } from "./AdminHomeCards";
import {
  KIND_LABELS,
  PLAN_COLORS,
  PLAN_LABELS,
  STATE_COLORS,
  STATE_LABELS,
  fmtAgo,
  fmtShortDate,
  tooltipStyle,
} from "./adminHomeData";

type SeriesPoint = { date: string; value: number };
type LabeledCount = { label: string; count: number };
type PlanCount = { plan: string; count: number };
type JobStatusCount = { status: string; count: number };
type RecentSignup = {
  userId: string;
  email: string;
  createdAt: string | null;
  plan: string;
};

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
  planCounts: PlanCount[];
  jobStatusCounts: JobStatusCount[];
  signupsSeries: SeriesPoint[];
  activitySeries: SeriesPoint[];
  activityByKind: LabeledCount[];
  projectStateCounts: LabeledCount[];
  recentSignups: RecentSignup[];
};

export default function AdminHomePage() {
  const { data, loading, error, refetch } = useQuery<{
    adminSystemStats: Stats;
  }>(ADMIN_SYSTEM_STATS_QUERY, { fetchPolicy: "cache-and-network" });
  const s = data?.adminSystemStats;

  const planChartData = useMemo(() => {
    if (!s) return [];
    return s.planCounts.map((p) => ({
      name: PLAN_LABELS[p.plan] ?? p.plan,
      value: p.count,
      color: PLAN_COLORS[p.plan] ?? "#94a3b8",
    }));
  }, [s]);

  const stateChartData = useMemo(() => {
    if (!s) return [];
    return s.projectStateCounts.map((p) => ({
      name: STATE_LABELS[p.label] ?? p.label,
      value: p.count,
      color: STATE_COLORS[p.label] ?? "#94a3b8",
    }));
  }, [s]);

  const activityChartData = useMemo(() => {
    if (!s) return [];
    return s.activityByKind.slice(0, 8).map((row) => ({
      name: KIND_LABELS[row.label] ?? row.label,
      value: row.count,
    }));
  }, [s]);

  const newUsers30d = useMemo(
    () => s?.signupsSeries.reduce((acc, p) => acc + p.value, 0) ?? 0,
    [s]
  );
  const newUsers7d = useMemo(() => {
    if (!s) return 0;
    return s.signupsSeries.slice(-7).reduce((acc, p) => acc + p.value, 0);
  }, [s]);

  const activityPctOfTotal =
    s && s.totalUsers > 0
      ? Math.round((s.mau / s.totalUsers) * 100)
      : 0;

  const healthIssues = s ? s.failedJobs + s.pendingJobs : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-text">
            Panel administrativo
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Estado de la plataforma — métricas en vivo de los últimos 30 días.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={loading}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg disabled:opacity-50"
        >
          {loading && !s ? "Cargando…" : "Refrescar"}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error.message}
        </div>
      )}

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Users size={16} />}
          label="Usuarios registrados"
          value={s?.totalUsers ?? 0}
          hint={newUsers7d > 0 ? `+${newUsers7d} esta semana` : "Sin nuevos esta semana"}
          loading={!s && loading}
          href="/admin/users"
          tone="brand"
        />
        <Kpi
          icon={<Activity size={16} />}
          label="Activos últimos 30 días"
          value={s?.mau ?? 0}
          hint={
            s
              ? `${s.dau} hoy · ${s.wau} esta semana · ${activityPctOfTotal}% del total`
              : "—"
          }
          loading={!s && loading}
          tone="neutral"
        />
        <Kpi
          icon={<ListTodo size={16} />}
          label="Trabajo en curso"
          value={s?.tasksOpen ?? 0}
          hint={
            s
              ? `${s.tasksDone30d} cerradas en 30d · ${s.ideasTotal} ideas`
              : "—"
          }
          loading={!s && loading}
          tone="neutral"
        />
        <Kpi
          icon={<AlertTriangle size={16} />}
          label="Salud del sistema"
          value={healthIssues}
          hint={
            s
              ? s.failedJobs > 0
                ? `${s.failedJobs} fallidos · ${s.pendingJobs} pendientes`
                : `${s.pendingJobs} jobs pendientes`
              : "—"
          }
          loading={!s && loading}
          tone={s && s.failedJobs > 0 ? "bad" : healthIssues > 0 ? "warn" : "good"}
          href="/admin/system/jobs"
        />
      </div>

      {/* Time-series row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Nuevos registros"
          subtitle={`Últimos 30 días · total ${newUsers30d}`}
          icon={<TrendingUp size={16} />}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={s?.signupsSeries ?? []}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtShortDate}
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => `Día ${fmtShortDate(v as string)}`}
                  formatter={(v) => [v, "Registros"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Actividad diaria (DAU)"
          subtitle="Usuarios únicos con cualquier acción ese día"
          icon={<Activity size={16} />}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={s?.activitySeries ?? []}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtShortDate}
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => `Día ${fmtShortDate(v as string)}`}
                  formatter={(v) => [v, "DAU"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Donuts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Distribución por plan"
          subtitle={
            s
              ? `${s.totalAccounts} cuentas con perfil${
                  s.admins > 0 ? ` · ${s.admins} admin` : ""
                }`
              : ""
          }
          icon={<Sparkles size={16} />}
        >
          <DonutChart data={planChartData} emptyLabel="Aún sin cuentas." />
        </ChartCard>

        <ChartCard
          title="Estado de proyectos"
          subtitle="Distribución global en todos los usuarios"
          icon={<CheckCircle2 size={16} />}
        >
          <DonutChart
            data={stateChartData}
            emptyLabel="Aún sin proyectos creados."
          />
        </ChartCard>
      </div>

      {/* Activity bar */}
      <ChartCard
        title="Tipo de actividad (últimos 30 días)"
        subtitle="Qué están haciendo realmente los usuarios"
        icon={<Activity size={16} />}
      >
        {activityChartData.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-muted">
            Aún sin actividad en los últimos 30 días.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activityChartData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [v, "Eventos"]}
                />
                <Bar
                  dataKey="value"
                  fill="#a78bfa"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* Recent signups + shortcuts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Últimos registros"
            subtitle="10 cuentas más recientes en Supabase"
            icon={<Users size={16} />}
          >
            {!s ? (
              <div className="py-6 text-sm text-text-muted">Cargando…</div>
            ) : s.recentSignups.length === 0 ? (
              <div className="py-6 text-sm text-text-muted">
                Aún sin registros visibles. ¿Está configurado el service-role key?
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {s.recentSignups.map((u) => (
                  <li
                    key={u.userId}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <Link
                      href={`/admin/users/${u.userId}`}
                      className="flex-1 min-w-0 text-sm text-text hover:text-accent"
                    >
                      <div className="truncate font-medium">{u.email}</div>
                      <div className="text-xs text-text-muted">
                        {fmtAgo(u.createdAt)}
                      </div>
                    </Link>
                    <PlanPill plan={u.plan} />
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </div>

        <div className="space-y-4">
          <Shortcut
            href="/admin/users"
            title="Gestionar usuarios"
            description="Cambia planes, otorga admin, mira actividad."
          />
          <Shortcut
            href="/admin/content/posts"
            title="Nueva entrada de blog"
            description="Escribe y publica en continuu.it/blog."
          />
          <Shortcut
            href="/admin/system/audit"
            title="Audit log"
            description="Cada acción admin queda registrada."
          />
        </div>
      </div>
    </div>
  );
}
