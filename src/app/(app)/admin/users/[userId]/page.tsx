"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_SET_USER_IS_ADMIN,
  ADMIN_SET_USER_IS_BILLING_EXEMPT,
  ADMIN_SET_USER_PLAN,
  ADMIN_USER_QUERY,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type Counts = {
  projects: number;
  tasksOpen: number;
  tasksDone: number;
  ideas: number;
  notes: number;
};

type LabeledCount = {
  label: string;
  count: number;
};

type UsagePoint = {
  date: string;
  messagesSent: number;
  tokensIn: number;
  tokensOut: number;
  costUsdCents: number;
};

type NotificationLinkInfo = {
  channel: string;
  verified: boolean;
  created: string;
};

type NotificationPrefs = {
  digestEnabled: boolean;
  dailyDigestEnabled: boolean;
  dueRemindersEnabled: boolean;
  sleepingAlertsEnabled: boolean;
  isAdmin: boolean;
  links: NotificationLinkInfo[];
};

type AdminUserDetail = {
  userId: string;
  email: string;
  plan: string;
  isAdmin: boolean;
  isBillingExempt: boolean;
  planRenewsAt: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  bannedUntil: string | null;
  lastActivity: string | null;
  interactions30dTotal: number;
  interactionsBySource: LabeledCount[];
  counts: Counts;
  usageLast30d: UsagePoint[];
  notifications: NotificationPrefs | null;
};

const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  mobile: "Móvil",
  connector: "Conector Claude",
  unknown: "Desconocido",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "studio", label: "Studio" },
  { value: "admin", label: "Admin (staff)" },
];

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";

  const { data, loading, error, refetch } = useQuery<{
    adminUser: AdminUserDetail;
  }>(ADMIN_USER_QUERY, { variables: { userId } });

  const user = data?.adminUser;

  const [setPlan, { loading: settingPlan }] = useMutation(
    ADMIN_SET_USER_PLAN,
    {
      onCompleted: () => {
        toast.success("Plan actualizado");
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );
  const [setIsAdmin, { loading: settingAdmin }] = useMutation(
    ADMIN_SET_USER_IS_ADMIN,
    {
      onCompleted: () => {
        toast.success("Rol actualizado");
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );
  const [setIsBillingExempt, { loading: settingExempt }] = useMutation(
    ADMIN_SET_USER_IS_BILLING_EXEMPT,
    {
      onCompleted: () => {
        toast.success("Exención de pago actualizada");
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );

  const totalUsageCost = useMemo(
    () =>
      (user?.usageLast30d ?? []).reduce((sum, d) => sum + d.costUsdCents, 0),
    [user]
  );
  const totalMessages = useMemo(
    () =>
      (user?.usageLast30d ?? []).reduce((sum, d) => sum + d.messagesSent, 0),
    [user]
  );

  if (loading && !user) {
    return <div className="text-text-muted">Cargando…</div>;
  }
  if (error) {
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error.message}
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-accent hover:underline"
        >
          ← Volver a usuarios
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text">{user.email}</h1>
        <p className="text-sm text-text-muted">{user.userId}</p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DataCard label="Plan">
          <div className="flex items-center gap-3">
            <select
              value={user.plan}
              disabled={settingPlan}
              onChange={(e) => {
                if (e.target.value === user.plan) return;
                if (
                  !confirm(
                    `Cambiar plan de ${user.email} a "${e.target.value}"?`
                  )
                ) {
                  e.target.value = user.plan;
                  return;
                }
                setPlan({
                  variables: { userId: user.userId, plan: e.target.value },
                });
              }}
              className="rounded border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-accent"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {user.planRenewsAt && (
              <span className="text-xs text-text-muted">
                Renueva {formatDate(user.planRenewsAt)}
              </span>
            )}
          </div>
        </DataCard>

        <DataCard label="Administrador">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={user.isAdmin}
              disabled={settingAdmin}
              onChange={(e) => {
                const next = e.target.checked;
                if (
                  !confirm(
                    next
                      ? `Otorgar privilegios admin a ${user.email}?`
                      : `Revocar privilegios admin de ${user.email}?`
                  )
                ) {
                  e.target.checked = user.isAdmin;
                  return;
                }
                setIsAdmin({
                  variables: { userId: user.userId, isAdmin: next },
                });
              }}
              className="h-4 w-4 accent-accent"
            />
            <span>{user.isAdmin ? "Sí — acceso completo" : "No"}</span>
          </label>
        </DataCard>

        <DataCard label="Exención de pago">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={user.isBillingExempt}
              disabled={settingExempt}
              onChange={(e) => {
                const next = e.target.checked;
                if (
                  !confirm(
                    next
                      ? `Marcar a ${user.email} como exento de pago? Mantendrá su plan sin que Stripe le cobre.`
                      : `Quitar la exención de pago de ${user.email}? Volverá al flujo normal de Stripe.`
                  )
                ) {
                  e.target.checked = user.isBillingExempt;
                  return;
                }
                setIsBillingExempt({
                  variables: {
                    userId: user.userId,
                    isBillingExempt: next,
                  },
                });
              }}
              className="h-4 w-4 accent-accent"
            />
            <span>
              {user.isBillingExempt
                ? "Sí — cortesía del equipo"
                : "No — Stripe cobra normal"}
            </span>
          </label>
        </DataCard>

        <DataCard label="Cuenta">
          <dl className="space-y-1 text-sm">
            <Field label="Creado" value={formatDate(user.createdAt)} />
            <Field label="Último ingreso" value={formatDate(user.lastSignInAt)} />
            <Field
              label="Email confirmado"
              value={formatDate(user.emailConfirmedAt)}
            />
            {user.bannedUntil && (
              <Field
                label="Suspendido hasta"
                value={formatDate(user.bannedUntil)}
              />
            )}
          </dl>
        </DataCard>

        <DataCard label="Stripe">
          <dl className="space-y-1 text-sm">
            <Field
              label="Customer"
              value={user.stripeCustomerId || "—"}
              mono
            />
            <Field
              label="Subscription"
              value={user.stripeSubscriptionId || "—"}
              mono
            />
          </dl>
        </DataCard>

        <DataCard label="Actividad">
          <dl className="space-y-1 text-sm">
            <Field label="Proyectos" value={String(user.counts.projects)} />
            <Field
              label="Tareas (abiertas/hechas)"
              value={`${user.counts.tasksOpen}/${user.counts.tasksDone}`}
            />
            <Field label="Ideas" value={String(user.counts.ideas)} />
            <Field label="Notas" value={String(user.counts.notes)} />
            <Field
              label="Última actividad"
              value={formatDate(user.lastActivity)}
            />
          </dl>
        </DataCard>

        <DataCard label="Asistente (30d)">
          <dl className="space-y-1 text-sm">
            <Field label="Mensajes" value={String(totalMessages)} />
            <Field
              label="Costo estimado"
              value={`$${(totalUsageCost / 100).toFixed(2)} USD`}
            />
            <Field
              label="Días con uso"
              value={String(user.usageLast30d.length)}
            />
          </dl>
        </DataCard>

        <DataCard label="Interacciones por canal (30d)">
          <div className="mb-2 text-2xl font-semibold text-text">
            {user.interactions30dTotal}
            <span className="ml-1.5 text-xs font-normal text-text-muted">
              en total
            </span>
          </div>
          <dl className="space-y-1 text-sm">
            {user.interactionsBySource.map((s) => (
              <Field
                key={s.label}
                label={SOURCE_LABELS[s.label] ?? s.label}
                value={String(s.count)}
              />
            ))}
          </dl>
          <p className="mt-2 text-xs text-text-muted">
            Acciones con efecto (mutaciones, mensajes al asistente, tool calls
            del conector). Solo conteos — sin contenido.
          </p>
        </DataCard>
      </section>

      {user.notifications && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">
            Notificaciones
          </h2>
          <div className="rounded-lg border border-border bg-surface p-4 text-sm">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Flag
                label="Resumen semanal"
                value={user.notifications.digestEnabled}
              />
              <Flag
                label="Resumen diario"
                value={user.notifications.dailyDigestEnabled}
              />
              <Flag
                label="Recordatorios"
                value={user.notifications.dueRemindersEnabled}
              />
              <Flag
                label="Alertas de inactividad"
                value={user.notifications.sleepingAlertsEnabled}
              />
            </div>
            {user.notifications.links.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="mb-2 text-xs uppercase text-text-muted">
                  Canales conectados
                </div>
                <ul className="space-y-1">
                  {user.notifications.links.map((l) => (
                    <li key={`${l.channel}-${l.created}`} className="flex gap-2">
                      <span className="capitalize text-text">{l.channel}</span>
                      <span className="text-text-muted">
                        {l.verified ? "verificado" : "pendiente"} · creado{" "}
                        {formatDate(l.created)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function DataCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 text-xs uppercase tracking-wide text-text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd
        className={
          mono
            ? "min-w-0 break-all text-right font-mono text-xs text-text"
            : "min-w-0 text-right text-text"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className={value ? "text-accent" : "text-text-muted"}>
        {value ? "activo" : "off"}
      </span>
    </div>
  );
}
