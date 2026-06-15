"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_MCP_OVERVIEW_QUERY,
  ADMIN_REVOKE_MCP_CONNECTION,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type Stats = {
  activeConnections: number;
  distinctUsers: number;
  byClient: { label: string; count: number }[];
};
type Conn = {
  userId: string;
  clientId: string;
  clientName: string;
  connectedAt: string | null;
};
type Event = {
  userId: string;
  clientId: string;
  clientName: string;
  event: string;
  created: string;
};

type Data = {
  adminMcpStats: Stats;
  adminMcpConnections: Conn[];
  adminMcpConnectionEvents: Event[];
};

const EVENT_LABELS: Record<string, string> = {
  authorized: "Autorizado",
  token_refreshed: "Token renovado",
  revoked: "Revocado (usuario)",
  admin_revoked: "Revocado (admin)",
};

function fmt(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

// Curated catalog of the project's relevant data domains: what it is, where to
// review it, and what actions to take. Extend this as new domains appear.
const CATALOG: {
  title: string;
  what: string;
  review: string;
  actions: string;
  href?: string;
}[] = [
  {
    title: "Usuarios",
    what: "Cuentas de Supabase + plan, rol admin, exención de pago e interacciones (30d).",
    review: "Lista y detalle por usuario, con métricas por canal (web/móvil/conector).",
    actions: "Cambiar plan, otorgar/revocar admin, marcar cortesía.",
    href: "/admin/users",
  },
  {
    title: "Feedback / bug reports",
    what: "Reportes que mandan los usuarios desde web y móvil (canal de un solo sentido).",
    review: "Inbox con estados nuevo / leído / archivado.",
    actions: "Marcar leído, archivar, reabrir o eliminar.",
    href: "/admin/feedback",
  },
  {
    title: "Billing",
    what: "Suscripciones de Stripe, planes activos e ingresos.",
    review: "Resumen de suscriptores y estado de cobro.",
    actions: "Revisar; los cambios de cobro se gestionan en Stripe.",
    href: "/admin/billing",
  },
  {
    title: "Jobs de notificaciones",
    what: "Cola de envíos (Telegram/push): digests, recordatorios, anuncios.",
    review: "Estado por job (pendiente / enviado / error) y reintentos.",
    actions: "Reintentar un job fallido.",
    href: "/admin/system/jobs",
  },
  {
    title: "Audit log (acciones admin)",
    what: "Trazabilidad de acciones administrativas (cambios de plan, revocaciones, etc.).",
    review: "Quién hizo qué y cuándo, con el payload del cambio.",
    actions: "Solo lectura — evidencia para auditoría / incidentes.",
    href: "/admin/system/audit",
  },
  {
    title: "Stats del sistema",
    what: "Métricas agregadas (cuentas, actividad, series de tiempo).",
    review: "Panel de salud general del producto.",
    actions: "Solo lectura.",
    href: "/admin/system/stats",
  },
];

export default function AdminDatabasePage() {
  const { data, loading, error, refetch } = useQuery<Data>(
    ADMIN_MCP_OVERVIEW_QUERY,
    { fetchPolicy: "cache-and-network" }
  );
  const [revoke, { loading: revoking }] = useMutation(
    ADMIN_REVOKE_MCP_CONNECTION,
    {
      onCompleted: () => {
        toast.success("Conexión revocada");
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );

  const stats = data?.adminMcpStats;
  const connections = data?.adminMcpConnections ?? [];
  const events = data?.adminMcpConnectionEvents ?? [];

  const handleRevoke = (c: Conn) => {
    if (
      !confirm(
        `Revocar la conexión de ${c.clientName || "Claude"} para el usuario ${shortId(
          c.userId
        )}? El cliente perderá acceso al expirar su token.`
      )
    ) {
      return;
    }
    revoke({ variables: { userId: c.userId, clientId: c.clientId } });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-text">Base de datos</h1>
        <p className="mt-1 text-sm text-text-muted">
          Centro para revisar la información relevante del proyecto y tomar
          acciones. Arriba, datos en vivo del conector de Claude; abajo, un
          catálogo de los demás dominios de datos con cómo revisarlos y qué
          hacer.
        </p>
      </header>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error.message}
        </div>
      )}

      {/* ---- Conector MCP (Claude) — datos en vivo ---- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text">
            Conector MCP (Claude)
          </h2>
          <p className="text-sm text-text-muted">
            Conexiones OAuth activas y registro de auditoría. Acción: revocar
            una conexión sospechosa o a petición del usuario.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Conexiones activas" value={stats?.activeConnections ?? 0} />
          <Stat label="Usuarios conectados" value={stats?.distinctUsers ?? 0} />
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-wide text-text-muted">
              Por cliente
            </div>
            <div className="mt-1 text-sm text-text">
              {stats?.byClient.length
                ? stats.byClient
                    .map((b) => `${b.label} (${b.count})`)
                    .join(", ")
                : "—"}
            </div>
          </div>
        </div>

        {/* Conexiones activas */}
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Cliente</th>
                <th className="px-4 py-2.5 font-semibold">Usuario</th>
                <th className="px-4 py-2.5 font-semibold">Conectado</th>
                <th className="px-4 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && connections.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && connections.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                    Sin conexiones activas.
                  </td>
                </tr>
              )}
              {connections.map((c) => (
                <tr key={`${c.userId}:${c.clientId}`} className="hover:bg-bg/40">
                  <td className="px-4 py-2.5 text-text">
                    {c.clientName || "Claude"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                    {shortId(c.userId)}
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {fmt(c.connectedAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevoke(c)}
                      disabled={revoking}
                      className="rounded border border-border px-2.5 py-1 text-xs text-text hover:bg-bg disabled:opacity-50"
                    >
                      Revocar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Auditoría reciente */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">
            Auditoría reciente
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Evento</th>
                  <th className="px-4 py-2.5 font-semibold">Cliente</th>
                  <th className="px-4 py-2.5 font-semibold">Usuario</th>
                  <th className="px-4 py-2.5 font-semibold">Cuándo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                      Sin eventos.
                    </td>
                  </tr>
                )}
                {events.map((e, i) => (
                  <tr key={i} className="hover:bg-bg/40">
                    <td className="px-4 py-2.5 text-text">
                      {EVENT_LABELS[e.event] ?? e.event}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">
                      {e.clientName || "Claude"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                      {shortId(e.userId)}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">{fmt(e.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- Catálogo de dominios ---- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">
          Otros datos del proyecto
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {CATALOG.map((c) => (
            <div
              key={c.title}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-text">{c.title}</h3>
                {c.href && (
                  <Link
                    href={c.href}
                    className="text-xs text-accent hover:underline shrink-0"
                  >
                    Revisar →
                  </Link>
                )}
              </div>
              <dl className="mt-2 space-y-1.5 text-xs">
                <Row term="Qué es" desc={c.what} />
                <Row term="Cómo revisar" desc={c.review} />
                <Row term="Acciones" desc={c.actions} />
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-text">{value}</div>
    </div>
  );
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-text-muted">{term}:</dt>
      <dd className="text-text">{desc}</dd>
    </div>
  );
}
