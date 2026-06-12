"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ListTodo,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { ADMIN_SYSTEM_STATS_QUERY } from "@/lib/graphql";

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

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  studio: "Studio",
  admin: "Admin",
};

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  pro: "#34d399",
  studio: "#a78bfa",
  admin: "#f59e0b",
};

const STATE_LABELS: Record<string, string> = {
  idea: "Idea",
  active: "Activo",
  stalled: "Estancado",
  paused: "Pausado",
  launched: "Lanzado",
  archived: "Archivado",
};

const STATE_COLORS: Record<string, string> = {
  idea: "#64748b",
  active: "#34d399",
  stalled: "#f59e0b",
  paused: "#60a5fa",
  launched: "#a78bfa",
  archived: "#475569",
};

const KIND_LABELS: Record<string, string> = {
  note: "Notas",
  project_created: "Proyectos creados",
  project_deleted: "Proyectos borrados",
  project_status_changed: "Cambios de estado",
  project_due_date_changed: "Fechas movidas",
  task_created: "Tareas creadas",
  task_completed: "Tareas cerradas",
  task_deleted: "Tareas borradas",
  task_due_date_changed: "Tareas reagendadas",
  idea_created: "Ideas",
  idea_deleted: "Ideas borradas",
  idea_promoted: "Ideas promovidas",
  routine_created: "Rutinas creadas",
  routine_completed: "Rutinas cumplidas",
  routine_deleted: "Rutinas borradas",
};

const fmtShortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const fmtAgo = (iso: string | null): string => {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString();
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

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
} as const;

type KpiTone = "brand" | "neutral" | "warn" | "bad" | "good";

function Kpi({
  icon,
  label,
  value,
  hint,
  href,
  loading,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  href?: string;
  loading?: boolean;
  tone?: KpiTone;
}) {
  const valueClass =
    tone === "bad"
      ? "text-red-400"
      : tone === "warn"
        ? "text-yellow-400"
        : tone === "good"
          ? "text-emerald-400"
          : tone === "brand"
            ? "text-accent"
            : "text-text";
  const inner = (
    <div className="rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--text)_4%,var(--surface))]">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-text-muted">
        <span>{label}</span>
        <span className="text-text-muted">{icon}</span>
      </div>
      <div className={`mt-3 text-3xl font-semibold tabular-nums ${valueClass}`}>
        {loading ? "…" : value.toLocaleString()}
      </div>
      {hint && (
        <div className="mt-1.5 text-xs text-text-muted line-clamp-1">
          {hint}
        </div>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            {icon ? <span className="text-accent">{icon}</span> : null}
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function DonutChart({
  data,
  emptyLabel,
}: {
  data: { name: string; value: number; color: string }[];
  emptyLabel: string;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) {
    return (
      <div className="py-10 text-center text-sm text-text-muted">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="var(--surface)"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => {
              const n = Number(value) || 0;
              return [
                `${n} (${total > 0 ? Math.round((n / total) * 100) : 0}%)`,
                String(name),
              ];
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlanPill({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] ?? "#94a3b8";
  const label = PLAN_LABELS[plan] ?? plan;
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

function Shortcut({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-text">{title}</div>
          <div className="mt-1 text-sm text-text-muted">{description}</div>
        </div>
        <ArrowRight
          size={16}
          className="mt-1 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>
    </Link>
  );
}
