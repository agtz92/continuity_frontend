"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_APP_CONFIG_QUERY,
  ADMIN_BETA_PIPELINE_QUERY,
  ADMIN_BETA_USERS_QUERY,
  ADMIN_SEND_TEST_EMAIL,
  ADMIN_SET_APP_CONFIG,
  ADMIN_SET_BETA,
  ADMIN_SET_BILLING_EXEMPT,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type BetaUserRow = {
  userId: string;
  email: string;
  createdAt: string | null;
  betaCohort: boolean;
  betaStatus: string;
  isBillingExempt: boolean;
  billingExemptReason: string;
  billingExemptUntil: string | null;
  betaEnrolledAt: string | null;
  daysSinceLastSignificantEvent: number | null;
  lastEmailId: string;
  lastEmailAt: string | null;
};

type LabeledCount = { label: string; count: number };
type AppConfigRow = { key: string; valueJson: string };

const BETA_STATUSES = ["active", "reclaimed", "manually_paused", "manually_killed"];
const EXEMPT_REASONS = ["beta", "friend", "investor", "partner", "manual"];
const EMAIL_IDS = [
  "welcome_beta",
  "welcome_regular",
  "inactivity_1",
  "inactivity_2",
  "inactivity_3",
  "inactivity_4",
  "reengage_1",
  "reengage_2",
  "reclaim_warn",
  "reclaim_final",
];

function fmtDate(v: string | null): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString();
}

export default function AdminBetaPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [exemptFilter, setExemptFilter] = useState<string>("");
  const [daysMin, setDaysMin] = useState<string>("");
  const [testTemplate, setTestTemplate] = useState<string>("welcome_beta");
  const [testLocale, setTestLocale] = useState<string>("es");

  const usersVars = useMemo(
    () => ({
      betaStatus: statusFilter || null,
      billingExempt: exemptFilter === "" ? null : exemptFilter === "yes",
      daysInactiveMin: daysMin === "" ? null : Number(daysMin),
    }),
    [statusFilter, exemptFilter, daysMin],
  );

  const usersQ = useQuery<{ adminBetaUsers: BetaUserRow[] }>(ADMIN_BETA_USERS_QUERY, {
    variables: usersVars,
    fetchPolicy: "cache-and-network",
  });
  const pipelineQ = useQuery<{
    adminBetaPipeline: {
      statusCounts: LabeledCount[];
      thresholdCounts: LabeledCount[];
      recentReclaims: { userId: string; email: string; betaStatus: string }[];
    };
  }>(ADMIN_BETA_PIPELINE_QUERY, { fetchPolicy: "cache-and-network" });
  const configQ = useQuery<{ adminAppConfig: AppConfigRow[] }>(ADMIN_APP_CONFIG_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const refetchAll = () => {
    usersQ.refetch();
    pipelineQ.refetch();
  };

  const [setBeta] = useMutation(ADMIN_SET_BETA, { onCompleted: refetchAll });
  const [setExempt] = useMutation(ADMIN_SET_BILLING_EXEMPT, { onCompleted: refetchAll });
  const [setConfig] = useMutation(ADMIN_SET_APP_CONFIG, {
    onCompleted: () => configQ.refetch(),
  });
  const [sendTest, { loading: sendingTest }] = useMutation(ADMIN_SEND_TEST_EMAIL);

  const onSendTest = async () => {
    try {
      const res = await sendTest({
        variables: { emailId: testTemplate, locale: testLocale },
      });
      toast.success(res.data?.adminSendTestEmail ?? "Enviado");
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`);
    }
  };

  const config = useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const row of configQ.data?.adminAppConfig ?? []) {
      try {
        map[row.key] = JSON.parse(row.valueJson);
      } catch {
        map[row.key] = row.valueJson;
      }
    }
    return map;
  }, [configQ.data]);

  const dryRun = config["dry_run"] === true;
  const enrollmentOpen = config["beta_enrollment_open"] === true;
  const spotCap = Number(config["beta_spot_cap"] ?? 0);

  const saveConfig = async (key: string, value: unknown) => {
    try {
      await setConfig({ variables: { key, valueJson: JSON.stringify(value) } });
      toast.success(`Config "${key}" actualizada`);
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`);
    }
  };

  const onSetStatus = async (userId: string, betaStatus: string) => {
    try {
      await setBeta({ variables: { userId, betaStatus } });
      toast.success("Estado beta actualizado");
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`);
    }
  };

  const onToggleExempt = async (row: BetaUserRow) => {
    try {
      await setExempt({
        variables: {
          userId: row.userId,
          isBillingExempt: !row.isBillingExempt,
          reason: !row.isBillingExempt ? row.billingExemptReason || "beta" : null,
        },
      });
      toast.success("Exención actualizada");
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`);
    }
  };

  const onSetReason = async (row: BetaUserRow, reason: string) => {
    try {
      await setExempt({
        variables: { userId: row.userId, isBillingExempt: true, reason },
      });
      toast.success("Razón actualizada");
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`);
    }
  };

  const users = usersQ.data?.adminBetaUsers ?? [];
  const pipeline = pipelineQ.data?.adminBetaPipeline;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-medium text-text">Beta lifecycle</h1>

      {!dryRun ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-text">
          <strong>LIVE</strong> — los emails se están enviando de verdad y el reclaim está activo.
        </div>
      ) : (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-text">
          <strong>dry_run</strong> activo — nada se envía ni se reclama (solo preview en email_sends).
        </div>
      )}

      {/* Global controls */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-text-muted">Controles globales</h2>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={enrollmentOpen}
              onChange={(e) => saveConfig("beta_enrollment_open", e.target.checked)}
            />
            Enrollment abierto
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            Cupo (spot cap)
            <input
              type="number"
              defaultValue={spotCap}
              className="w-20 rounded border border-border bg-bg px-2 py-1"
              onBlur={(e) => {
                const n = Number(e.target.value);
                if (!Number.isNaN(n) && n !== spotCap) saveConfig("beta_spot_cap", n);
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            Inicio de secuencia
            <input
              type="date"
              defaultValue={String(config["lifecycle_start_at"] ?? "")}
              className="rounded border border-border bg-bg px-2 py-1"
              onBlur={(e) => {
                if (e.target.value !== String(config["lifecycle_start_at"] ?? ""))
                  saveConfig("lifecycle_start_at", e.target.value);
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => saveConfig("dry_run", e.target.checked)}
            />
            dry_run
          </label>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          "Inicio de secuencia": nadie cuenta como inactivo desde antes de esa fecha
          (arranque gradual). Vacío = desde sus fechas reales.
        </p>
      </section>

      {/* Test email */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-text-muted">
          Probar entrega (se envía a tu correo, ignora dry_run)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={testTemplate}
            onChange={(e) => setTestTemplate(e.target.value)}
            className="rounded border border-border bg-bg px-2 py-1 text-sm"
          >
            {EMAIL_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <select
            value={testLocale}
            onChange={(e) => setTestLocale(e.target.value)}
            className="rounded border border-border bg-bg px-2 py-1 text-sm"
          >
            <option value="es">es</option>
            <option value="en">en</option>
          </select>
          <button
            type="button"
            onClick={onSendTest}
            disabled={sendingTest}
            className="rounded bg-accent px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {sendingTest ? "Enviando…" : "Enviar a mi correo"}
          </button>
        </div>
      </section>

      {/* Pipeline */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-text-muted">Pipeline</h2>
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="mb-1 text-xs text-text-muted">Por estado</div>
            <div className="flex gap-3">
              {(pipeline?.statusCounts ?? []).map((c) => (
                <span key={c.label} className="text-sm text-text">
                  {c.label}: <strong>{c.count}</strong>
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-text-muted">Inactividad (activos)</div>
            <div className="flex gap-3">
              {(pipeline?.thresholdCounts ?? []).map((c) => (
                <span key={c.label} className="text-sm text-text">
                  {c.label}: <strong>{c.count}</strong>
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-text-muted">Reclaims recientes</div>
            <div className="text-sm text-text">{pipeline?.recentReclaims.length ?? 0}</div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
        >
          <option value="">Todos los estados</option>
          {BETA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={exemptFilter}
          onChange={(e) => setExemptFilter(e.target.value)}
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
        >
          <option value="">Exención: todas</option>
          <option value="yes">Exentos</option>
          <option value="no">No exentos</option>
        </select>
        <input
          type="number"
          placeholder="Días inactivo ≥"
          value={daysMin}
          onChange={(e) => setDaysMin(e.target.value)}
          className="w-36 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </section>

      {/* Table */}
      <section className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-text-muted">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Signup</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Exento</th>
              <th className="px-3 py-2">Razón</th>
              <th className="px-3 py-2">Días inactivo</th>
              <th className="px-3 py-2">Último email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.userId} className="border-t border-border">
                <td className="px-3 py-2 text-text">{row.email || row.userId.slice(0, 8)}</td>
                <td className="px-3 py-2 text-text-muted">{fmtDate(row.createdAt)}</td>
                <td className="px-3 py-2">
                  <select
                    value={row.betaStatus}
                    onChange={(e) => onSetStatus(row.userId, e.target.value)}
                    className="rounded border border-border bg-bg px-1 py-0.5"
                  >
                    {BETA_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={row.isBillingExempt}
                    onChange={() => onToggleExempt(row)}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.billingExemptReason}
                    disabled={!row.isBillingExempt}
                    onChange={(e) => onSetReason(row, e.target.value)}
                    className="rounded border border-border bg-bg px-1 py-0.5 disabled:opacity-50"
                  >
                    <option value="">—</option>
                    {EXEMPT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-text-muted">
                  {row.daysSinceLastSignificantEvent ?? "—"}
                </td>
                <td className="px-3 py-2 text-text-muted">
                  {row.lastEmailId ? `${row.lastEmailId} (${fmtDate(row.lastEmailAt)})` : "—"}
                </td>
              </tr>
            ))}
            {users.length === 0 && !usersQ.loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-text-muted">
                  Sin usuarios en el cohorte para estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
