"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ADMIN_SYSTEM_STATS_QUERY } from "@/lib/graphql";

type Stats = {
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
  planCounts: { plan: string; count: number }[];
};

export default function AdminHomePage() {
  const { data, loading } = useQuery<{ adminSystemStats: Stats }>(
    ADMIN_SYSTEM_STATS_QUERY,
    { fetchPolicy: "cache-and-network" }
  );
  const s = data?.adminSystemStats;
  const proCount =
    s?.planCounts.find((row) => row.plan === "pro")?.count ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">Panel administrativo</h1>
        <p className="mt-1 text-sm text-text-muted">
          Resumen rápido del estado de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Usuarios totales"
          value={loading && !s ? "…" : String(s?.totalAccounts ?? 0)}
          href="/admin/users"
        />
        <StatCard
          label="Usuarios Pro"
          value={loading && !s ? "…" : String(proCount)}
          href="/admin/users"
        />
        <StatCard
          label="Posts publicados"
          value={loading && !s ? "…" : String(s?.blogPostsPublished ?? 0)}
          href="/admin/content/posts"
        />
        <StatCard
          label="Jobs pendientes"
          value={loading && !s ? "…" : String(s?.pendingJobs ?? 0)}
          tone={s && s.pendingJobs > 0 ? "warn" : "neutral"}
          href="/admin/system/jobs"
        />
        <StatCard
          label="DAU (24h)"
          value={loading && !s ? "…" : String(s?.dau ?? 0)}
        />
        <StatCard
          label="WAU (7d)"
          value={loading && !s ? "…" : String(s?.wau ?? 0)}
        />
        <StatCard
          label="MAU (30d)"
          value={loading && !s ? "…" : String(s?.mau ?? 0)}
        />
        <StatCard
          label="Jobs fallidos"
          value={loading && !s ? "…" : String(s?.failedJobs ?? 0)}
          tone={s && s.failedJobs > 0 ? "bad" : "neutral"}
          href="/admin/system/jobs"
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">Atajos</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Shortcut
            href="/admin/content/posts"
            title="Nueva entrada de blog"
            description="Escribe y publica algo en continuu.it/blog."
          />
          <Shortcut
            href="/admin/users"
            title="Gestionar usuarios"
            description="Cambia planes, otorga acceso admin, mira actividad."
          />
          <Shortcut
            href="/admin/system/audit"
            title="Audit log"
            description="Cada acción administrativa queda registrada."
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "bad";
  href?: string;
}) {
  const cls =
    tone === "bad"
      ? "text-red-400"
      : tone === "warn"
        ? "text-yellow-400"
        : "text-text";
  const inner = (
    <div className="rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-bg/30">
      <div className="text-xs uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
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
      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
    >
      <div className="font-medium text-text">{title}</div>
      <div className="mt-1 text-sm text-text-muted">{description}</div>
    </Link>
  );
}
