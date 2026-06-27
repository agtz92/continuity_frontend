"use client";

/**
 * Tarjetas/gráficos presentacionales de la home de admin: KPI, contenedor de
 * gráfico, donut, pill de plan y atajo. Extraído de page.tsx (ver
 * AUDITORIA_CODIGO.md). Las piezas son presentacionales (props simples).
 */

import Link from "next/link";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { PLAN_COLORS, PLAN_LABELS, tooltipStyle } from "./adminHomeData";

type KpiTone = "brand" | "neutral" | "warn" | "bad" | "good";

export function Kpi({
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

export function ChartCard({
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

export function DonutChart({
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

export function PlanPill({ plan }: { plan: string }) {
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

export function Shortcut({
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
