"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import {
  ADMIN_BILLING_OVERVIEW_QUERY,
  ADMIN_SUBSCRIBERS_QUERY,
} from "@/lib/graphql";

type Overview = {
  currency: string;
  isTestMode: boolean;
  payingSubscribers: number;
  mrrCents: number;
  arrCents: number;
  billingExemptCount: number;
  pendingCancellations: number;
  breakdown: {
    plan: string;
    period: string;
    count: number;
    monthlyCentsEach: number;
    totalMonthlyCents: number;
  }[];
  upcomingChurn: {
    userId: string;
    email: string;
    plan: string;
    period: string;
    planRenewsAt: string | null;
    monthlyCents: number;
  }[];
};

type SubscriberRow = {
  userId: string;
  email: string;
  plan: string;
  period: string;
  monthlyCents: number;
  planRenewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  isBillingExempt: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

type SubscriberPage = {
  rows: SubscriberRow[];
  page: number;
  perPage: number;
  hasNext: boolean;
  total: number;
};

const PER_PAGE = 50;

function formatMoney(cents: number, currency: string) {
  if (!cents) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function stripeCustomerUrl(customerId: string, isTest: boolean) {
  if (!customerId) return null;
  const base = "https://dashboard.stripe.com";
  return `${base}/${isTest ? "test/" : ""}customers/${customerId}`;
}

export default function BillingPage() {
  const overviewQ = useQuery<{ adminBillingOverview: Overview }>(
    ADMIN_BILLING_OVERVIEW_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const overview = overviewQ.data?.adminBillingOverview;

  const [page, setPage] = useState(1);
  const [plan, setPlan] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [emailContains, setEmailContains] = useState<string>("");
  const [emailDraft, setEmailDraft] = useState<string>("");
  const [includeExempt, setIncludeExempt] = useState(false);

  const subsQ = useQuery<{ adminSubscribers: SubscriberPage }>(
    ADMIN_SUBSCRIBERS_QUERY,
    {
      variables: {
        page,
        perPage: PER_PAGE,
        plan: plan || null,
        period: period || null,
        emailContains: emailContains || null,
        includeExempt,
      },
      fetchPolicy: "cache-and-network",
    },
  );
  const subs = subsQ.data?.adminSubscribers;

  const currency = overview?.currency ?? "usd";
  const isTest = overview?.isTestMode ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Billing</h1>
          <p className="mt-1 text-sm text-text-muted">
            Métricas derivadas de los modelos locales (sincronizados vía
            webhook). MRR/ARR son estimaciones basadas en los precios
            configurados en env, no en lo realmente cobrado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overview && (
            <span
              className={
                "rounded border px-2 py-1 text-xs " +
                (isTest
                  ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                  : "border-green-500/40 bg-green-500/10 text-green-400")
              }
            >
              {isTest ? "Stripe: TEST MODE" : "Stripe: LIVE"}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              overviewQ.refetch();
              subsQ.refetch();
            }}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg"
          >
            Refrescar
          </button>
        </div>
      </div>

      {overviewQ.loading && !overview && (
        <div className="text-text-muted">Cargando…</div>
      )}
      {overviewQ.error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {overviewQ.error.message}
        </div>
      )}

      {overview && (
        <>
          <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Stat
              label="MRR estimado"
              value={formatMoney(overview.mrrCents, currency)}
              hint={
                overview.mrrCents === 0
                  ? "Configura *_AMOUNT_CENTS en env"
                  : undefined
              }
            />
            <Stat
              label="ARR estimado"
              value={formatMoney(overview.arrCents, currency)}
            />
            <Stat
              label="Suscriptores pagantes"
              value={String(overview.payingSubscribers)}
            />
            <Stat
              label="Billing exempt"
              value={String(overview.billingExemptCount)}
              hint="Cuentas pro/studio sin cobro"
            />
            <Stat
              label="Cancelaciones pendientes"
              value={String(overview.pendingCancellations)}
              tone={overview.pendingCancellations > 0 ? "warn" : "neutral"}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 text-xs uppercase text-text-muted">
                Desglose por plan y periodo
              </div>
              {overview.breakdown.length === 0 ? (
                <div className="text-sm text-text-muted">
                  Aún no hay suscriptores pagantes.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-text-muted">
                      <th className="py-1">Plan</th>
                      <th className="py-1">Periodo</th>
                      <th className="py-1 text-right">Subs</th>
                      <th className="py-1 text-right">$/mes c/u</th>
                      <th className="py-1 text-right">Total /mes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.breakdown.map((row) => (
                      <tr
                        key={`${row.plan}-${row.period}`}
                        className="border-t border-border"
                      >
                        <td className="py-1.5 capitalize text-text">
                          {row.plan}
                        </td>
                        <td className="py-1.5 capitalize text-text-muted">
                          {row.period === "annual"
                            ? "Anual"
                            : row.period === "monthly"
                              ? "Mensual"
                              : row.period}
                        </td>
                        <td className="py-1.5 text-right text-text">
                          {row.count}
                        </td>
                        <td className="py-1.5 text-right text-text-muted">
                          {formatMoney(row.monthlyCentsEach, currency)}
                        </td>
                        <td className="py-1.5 text-right text-text">
                          {formatMoney(row.totalMonthlyCents, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 text-xs uppercase text-text-muted">
                Churn pendiente (próximas cancelaciones)
              </div>
              {overview.upcomingChurn.length === 0 ? (
                <div className="text-sm text-text-muted">
                  Sin cancelaciones agendadas. 🎉
                </div>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {overview.upcomingChurn.map((c) => (
                    <li
                      key={c.userId}
                      className="flex items-center justify-between gap-2 border-t border-border py-1.5 first:border-t-0 first:pt-0"
                    >
                      <Link
                        href={`/admin/users/${c.userId}`}
                        className="truncate text-accent hover:underline"
                      >
                        {c.email || c.userId}
                      </Link>
                      <span className="shrink-0 text-xs text-text-muted">
                        {c.plan} · {formatMoney(c.monthlyCents, currency)}/mes
                        · vence {formatDate(c.planRenewsAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}

      {/* Tabla de suscriptores */}
      <section className="rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
          <div>
            <label className="block text-xs uppercase text-text-muted">
              Plan
            </label>
            <select
              value={plan}
              onChange={(e) => {
                setPlan(e.target.value);
                setPage(1);
              }}
              className="mt-1 rounded border border-border bg-bg px-2 py-1 text-sm text-text"
            >
              <option value="">Todos</option>
              <option value="pro">Pro</option>
              <option value="studio">Studio</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-text-muted">
              Periodo
            </label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
              className="mt-1 rounded border border-border bg-bg px-2 py-1 text-sm text-text"
            >
              <option value="">Todos</option>
              <option value="monthly">Mensual</option>
              <option value="annual">Anual</option>
            </select>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEmailContains(emailDraft.trim());
              setPage(1);
            }}
            className="flex items-end gap-2"
          >
            <div>
              <label className="block text-xs uppercase text-text-muted">
                Buscar por email
              </label>
              <input
                type="text"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder="contiene…"
                className="mt-1 rounded border border-border bg-bg px-2 py-1 text-sm text-text"
              />
            </div>
            <button
              type="submit"
              className="rounded border border-border bg-bg px-3 py-1 text-sm text-text hover:bg-surface"
            >
              Buscar
            </button>
          </form>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={includeExempt}
              onChange={(e) => {
                setIncludeExempt(e.target.checked);
                setPage(1);
              }}
            />
            Incluir exentos
          </label>
        </div>

        {subsQ.loading && !subs && (
          <div className="p-4 text-text-muted">Cargando…</div>
        )}
        {subsQ.error && (
          <div className="m-4 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {subsQ.error.message}
          </div>
        )}

        {subs && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-text-muted">
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Periodo</th>
                    <th className="px-4 py-2 text-right">$/mes</th>
                    <th className="px-4 py-2">Renueva</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2">Stripe</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-text-muted"
                      >
                        Sin resultados.
                      </td>
                    </tr>
                  )}
                  {subs.rows.map((r) => {
                    const url = stripeCustomerUrl(r.stripeCustomerId, isTest);
                    return (
                      <tr key={r.userId} className="border-t border-border">
                        <td className="px-4 py-2">
                          <Link
                            href={`/admin/users/${r.userId}`}
                            className="text-accent hover:underline"
                          >
                            {r.email || r.userId}
                          </Link>
                        </td>
                        <td className="px-4 py-2 capitalize text-text">
                          {r.plan}
                        </td>
                        <td className="px-4 py-2 capitalize text-text-muted">
                          {r.period === "annual"
                            ? "Anual"
                            : r.period === "monthly"
                              ? "Mensual"
                              : "—"}
                        </td>
                        <td className="px-4 py-2 text-right text-text">
                          {formatMoney(r.monthlyCents, currency)}
                        </td>
                        <td className="px-4 py-2 text-text-muted">
                          {formatDate(r.planRenewsAt)}
                        </td>
                        <td className="px-4 py-2">
                          {r.isBillingExempt && (
                            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-xs text-blue-400">
                              Exento
                            </span>
                          )}
                          {r.cancelAtPeriodEnd && (
                            <span className="ml-1 rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs text-yellow-400">
                              Cancela
                            </span>
                          )}
                          {!r.isBillingExempt && !r.cancelAtPeriodEnd && (
                            <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-xs text-green-400">
                              Activa
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-accent hover:underline"
                            >
                              Abrir →
                            </a>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border p-4 text-sm">
              <div className="text-text-muted">
                {subs.total} {subs.total === 1 ? "suscriptor" : "suscriptores"}
                {" · "}página {subs.page}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-border bg-bg px-3 py-1 text-text disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!subs.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-border bg-bg px-3 py-1 text-text disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "bad";
  hint?: string;
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
      <div className={`mt-2 text-2xl font-semibold ${cls}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}
