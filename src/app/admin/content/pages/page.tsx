"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { ADMIN_PAGES_QUERY, ADMIN_PAGE_CREATE } from "@/lib/graphql";
import { toast } from "@/lib/toast";

type Row = {
  id: string;
  path: string;
  title: string;
  status: string;
  showInNav: boolean;
  navOrder: number;
  publishedAt: string | null;
  updatedAt: string;
};

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export default function AdminPagesPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const { data, loading, refetch } = useQuery<{ adminPages: Row[] }>(
    ADMIN_PAGES_QUERY,
    { fetchPolicy: "cache-and-network" }
  );
  const [create, { loading: createLoading }] = useMutation(ADMIN_PAGE_CREATE, {
    onCompleted: (res) => {
      toast.success("Página creada");
      router.push(`/admin/content/pages/${res.adminPageCreate.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = data?.adminPages ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Páginas</h1>
          <p className="mt-1 text-sm text-text-muted">
            Páginas estáticas montadas en continuu.it/&lt;path&gt;.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg"
          >
            Refrescar
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
          >
            Nueva página
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Título</th>
              <th className="px-4 py-2.5 font-semibold">Path</th>
              <th className="px-4 py-2.5 font-semibold">Estado</th>
              <th className="px-4 py-2.5 font-semibold">Nav</th>
              <th className="px-4 py-2.5 font-semibold">Publicado</th>
              <th className="px-4 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                  Sin páginas todavía.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-bg/40">
                <td className="px-4 py-2.5 text-text">{p.title}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                  {p.path}
                </td>
                <td className="px-4 py-2.5 text-text-muted">{p.status}</td>
                <td className="px-4 py-2.5 text-text-muted">
                  {p.showInNav ? `sí (orden ${p.navOrder})` : "no"}
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/content/pages/${p.id}`}
                    className="text-accent hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-text">Nueva página</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Título</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Path</label>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/about"
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-sm font-mono text-text"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setTitle("");
                  setPath("");
                }}
                className="rounded border border-border px-3 py-1.5 text-sm text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!title.trim() || !path.trim() || createLoading}
                onClick={() =>
                  create({
                    variables: {
                      data: {
                        title: title.trim(),
                        path: path.trim(),
                        contentJson: EMPTY_DOC,
                        showInNav: false,
                        navOrder: 0,
                        locale: "es",
                      },
                    },
                  })
                }
                className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
