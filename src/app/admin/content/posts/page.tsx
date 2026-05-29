"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_BLOG_POSTS_QUERY,
  ADMIN_BLOG_POST_CREATE,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useAutoFocus } from "@/hooks/useAutoFocus";

type Row = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  locale: string;
  excerpt: string;
  contentJson: object;
  coverImageUrl: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
};

type ListData = {
  adminBlogPosts: {
    posts: Row[];
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

function uniqueCopySlug(base: string, taken: Set<string>): string {
  const root = `${base}-copia`;
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

export default function AdminPostsPage() {
  const router = useRouter();
  const autoFocus = useAutoFocus();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<ListData>(ADMIN_BLOG_POSTS_QUERY, {
    variables: {
      page,
      perPage: 25,
      status: status || null,
      search: search || null,
    },
    fetchPolicy: "cache-and-network",
  });

  const [create, { loading: createLoading }] = useMutation(
    ADMIN_BLOG_POST_CREATE,
    {
      onCompleted: (res) => {
        toast.success("Entrada creada");
        router.push(`/admin/content/posts/${res.adminBlogPostCreate.id}`);
      },
      onError: (e) => toast.error(e.message),
    }
  );

  const rows = data?.adminBlogPosts.posts ?? [];
  const existingSlugs = useMemo(
    () => new Set(rows.map((r) => r.slug)),
    [rows]
  );

  const [duplicate] = useMutation(ADMIN_BLOG_POST_CREATE, {
    onCompleted: (res) => {
      toast.success("Entrada duplicada");
      router.push(`/admin/content/posts/${res.adminBlogPostCreate.id}`);
    },
    onError: (e) => {
      setDuplicatingId(null);
      toast.error(e.message);
    },
  });

  const handleDuplicate = (p: Row) => {
    setDuplicatingId(p.id);
    duplicate({
      variables: {
        data: {
          title: `${p.title} (copia)`,
          slug: uniqueCopySlug(p.slug, existingSlugs),
          excerpt: p.excerpt ?? "",
          contentJson: p.contentJson ?? EMPTY_DOC,
          coverImageUrl: p.coverImageUrl ?? "",
          tags: p.tags ?? [],
          seoTitle: p.seoTitle ?? "",
          seoDescription: p.seoDescription ?? "",
          locale: p.locale,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Entradas de blog</h1>
          <p className="mt-1 text-sm text-text-muted">
            Crea, edita y publica entradas para continuu.it/blog.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
        >
          Nueva entrada
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título…"
          className="rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
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

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Título</th>
              <th className="px-4 py-2.5 font-semibold">Slug</th>
              <th className="px-4 py-2.5 font-semibold">Estado</th>
              <th className="px-4 py-2.5 font-semibold">Idioma</th>
              <th className="px-4 py-2.5 font-semibold">Publicado</th>
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
                  Sin entradas todavía.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-bg/40">
                <td className="px-4 py-2.5 text-text">{p.title}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                  {p.slug}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-2.5 text-text-muted">{p.locale}</td>
                <td className="px-4 py-2.5 text-text-muted">
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-2.5 text-text-muted">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(p)}
                      disabled={duplicatingId === p.id}
                      className="text-text-muted hover:text-text disabled:opacity-50"
                    >
                      {duplicatingId === p.id ? "Duplicando…" : "Duplicar"}
                    </button>
                    <Link
                      href={`/admin/content/posts/${p.id}`}
                      className="text-accent hover:underline"
                    >
                      Editar
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={data?.adminBlogPosts.page ?? page}
        hasNext={data?.adminBlogPosts.hasNext ?? false}
        loading={loading}
        onChange={setPage}
      />

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-text">Nueva entrada</h2>
            <p className="mt-1 text-sm text-text-muted">
              El slug y el contenido se pueden editar después.
            </p>
            <input
              autoFocus={autoFocus}
              enterKeyHint="done"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Título"
              className="mt-4 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
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
                disabled={!draftTitle.trim() || createLoading}
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
