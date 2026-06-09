"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_HELP_CATEGORIES_QUERY,
  ADMIN_HELP_RESOURCES_QUERY,
  ADMIN_HELP_RESOURCE_CREATE,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useAutoFocus } from "@/hooks/useAutoFocus";

type Category = {
  id: string;
  slug: string;
  name: string;
  resourceCount: number;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  locale: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
};

type ListData = {
  adminHelpResources: {
    resources: Row[];
    page: number;
    perPage: number;
    hasNext: boolean;
  };
};

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

export default function AdminResourcesPage() {
  const router = useRouter();
  const autoFocus = useAutoFocus();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");

  const { data: catsData } = useQuery<{ adminHelpCategories: Category[] }>(
    ADMIN_HELP_CATEGORIES_QUERY
  );

  const { data, loading, refetch } = useQuery<ListData>(
    ADMIN_HELP_RESOURCES_QUERY,
    {
      variables: {
        page,
        perPage: 25,
        status: status || null,
        categoryId: categoryId || null,
        search: search || null,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const [create, { loading: createLoading }] = useMutation(
    ADMIN_HELP_RESOURCE_CREATE,
    {
      onCompleted: (res) => {
        toast.success("Recurso creado");
        router.push(`/admin/content/resources/${res.adminHelpResourceCreate.id}`);
      },
      onError: (e) => toast.error(e.message),
    }
  );

  const categories = catsData?.adminHelpCategories ?? [];
  const rows = data?.adminHelpResources.resources ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Recursos de ayuda</h1>
          <p className="mt-1 text-sm text-text-muted">
            Centro de ayuda público en continuu.it/ayuda.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/content/resources/categories"
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg"
          >
            Categorías
          </Link>
          <button
            type="button"
            onClick={() => {
              if (categories.length === 0) {
                toast.error("Crea primero al menos una categoría");
                return;
              }
              setDraftCategoryId(categories[0].id);
              setCreating(true);
            }}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
          >
            Nuevo recurso
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título…"
          className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent sm:w-auto"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent sm:w-auto"
        >
          <option value="">Cualquier categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent sm:w-auto"
        >
          <option value="">Cualquier estado</option>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg"
        >
          Refrescar
        </button>
      </div>

      {/* Tarjetas (móvil) */}
      <div className="space-y-3 md:hidden">
        {loading && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Cargando…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Aún no hay recursos.
          </div>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-text">{r.title}</div>
                <div className="mt-0.5 truncate font-mono text-xs text-text-muted">
                  {r.slug}
                </div>
              </div>
              <Link
                href={`/admin/content/resources/${r.id}`}
                className="shrink-0 text-sm text-accent hover:underline"
              >
                Editar
              </Link>
            </div>

            <div className="mt-3">
              <StatusBadge status={r.status} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
              <span>
                Categoría: <span className="text-text">{r.categoryName}</span>
              </span>
              <span>
                Idioma: <span className="text-text">{r.locale}</span>
              </span>
              <span>
                Actualizado{" "}
                <span className="text-text">
                  {new Date(r.updatedAt).toLocaleDateString()}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla (escritorio) */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Título</th>
              <th className="px-4 py-2.5 font-semibold">Categoría</th>
              <th className="px-4 py-2.5 font-semibold">Slug</th>
              <th className="px-4 py-2.5 font-semibold">Estado</th>
              <th className="px-4 py-2.5 font-semibold">Idioma</th>
              <th className="px-4 py-2.5 font-semibold">Actualizado</th>
              <th className="px-4 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  Aún no hay recursos.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-bg/40">
                <td className="px-4 py-2.5 text-text">{r.title}</td>
                <td className="px-4 py-2.5 text-text-muted">{r.categoryName}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                  {r.slug}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-2.5 text-text-muted">{r.locale}</td>
                <td className="px-4 py-2.5 text-text-muted">
                  {new Date(r.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/content/resources/${r.id}`}
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

      <Pagination
        page={data?.adminHelpResources.page ?? page}
        hasNext={data?.adminHelpResources.hasNext ?? false}
        loading={loading}
        onChange={setPage}
      />

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-text">Nuevo recurso</h2>
            <p className="mt-1 text-sm text-text-muted">
              Asigna una categoría; el contenido se edita después.
            </p>
            <label className="mt-4 block text-xs text-text-muted">Categoría</label>
            <select
              value={draftCategoryId}
              onChange={(e) => setDraftCategoryId(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-xs text-text-muted">Título</label>
            <input
              autoFocus={autoFocus}
              enterKeyHint="done"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
            <div className="mt-2 text-xs text-text-muted">
              Slug propuesto: <span className="font-mono">{slugify(draftTitle) || "—"}</span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setDraftTitle("");
                }}
                className="rounded border border-border px-3 py-1.5 text-sm text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!draftTitle.trim() || !draftCategoryId || createLoading}
                onClick={() => {
                  const slug = slugify(draftTitle);
                  if (!slug) {
                    toast.error("Slug inválido");
                    return;
                  }
                  create({
                    variables: {
                      data: {
                        title: draftTitle.trim(),
                        slug,
                        categoryId: draftCategoryId,
                        excerpt: "",
                        contentJson: EMPTY_DOC,
                        tags: [],
                        locale: "es",
                      },
                    },
                  });
                }}
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Borrador", cls: "bg-bg text-text-muted" },
    published: { label: "Publicado", cls: "bg-accent/20 text-accent" },
    archived: { label: "Archivado", cls: "bg-bg text-text-muted line-through" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-bg text-text-muted" };
  return (
    <span className={`rounded px-2 py-0.5 text-xs uppercase ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function Pagination({
  page,
  hasNext,
  loading,
  onChange,
}: {
  page: number;
  hasNext: boolean;
  loading: boolean;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-text-muted">
      <div>Página {page}</div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="rounded border border-border px-3 py-1 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={!hasNext || loading}
          onClick={() => onChange(page + 1)}
          className="rounded border border-border px-3 py-1 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
