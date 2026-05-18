"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_HELP_CATEGORIES_QUERY,
  ADMIN_HELP_CATEGORY_CREATE,
  ADMIN_HELP_CATEGORY_DELETE,
  ADMIN_HELP_CATEGORY_UPDATE,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  locale: string;
  resourceCount: number;
  createdAt: string;
  updatedAt: string;
};

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

type FormState = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  locale: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  slug: "",
  description: "",
  icon: "",
  order: 0,
  locale: "es",
};

export default function CategoriesPage() {
  const { data, loading, refetch } = useQuery<{ adminHelpCategories: Category[] }>(
    ADMIN_HELP_CATEGORIES_QUERY,
    { fetchPolicy: "cache-and-network" }
  );

  const [editing, setEditing] = useState<FormState | null>(null);

  const [createCat, { loading: creating }] = useMutation(
    ADMIN_HELP_CATEGORY_CREATE,
    {
      onCompleted: () => {
        toast.success("Categoría creada");
        setEditing(null);
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );

  const [updateCat, { loading: updating }] = useMutation(
    ADMIN_HELP_CATEGORY_UPDATE,
    {
      onCompleted: () => {
        toast.success("Categoría actualizada");
        setEditing(null);
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );

  const [deleteCat] = useMutation(ADMIN_HELP_CATEGORY_DELETE, {
    onCompleted: () => {
      toast.success("Categoría eliminada");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = data?.adminHelpCategories ?? [];

  function handleSubmit() {
    if (!editing) return;
    if (!editing.name.trim() || !editing.slug.trim()) {
      toast.error("Nombre y slug requeridos");
      return;
    }
    const payload = {
      name: editing.name.trim(),
      slug: editing.slug.trim(),
      description: editing.description,
      icon: editing.icon,
      order: editing.order,
      locale: editing.locale,
    };
    if (editing.id) {
      updateCat({ variables: { id: editing.id, data: payload } });
    } else {
      createCat({ variables: { data: payload } });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/content/resources"
            className="text-sm text-accent hover:underline"
          >
            ← Volver
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-text">
            Categorías de ayuda
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Agrupa los recursos por tema (ej. Primeros pasos, Facturación).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY_FORM })}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
        >
          Nueva categoría
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Nombre</th>
              <th className="px-4 py-2.5 font-semibold">Slug</th>
              <th className="px-4 py-2.5 font-semibold">Orden</th>
              <th className="px-4 py-2.5 font-semibold">Recursos</th>
              <th className="px-4 py-2.5 font-semibold">Idioma</th>
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
                  Aún no hay categorías.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-bg/40">
                <td className="px-4 py-2.5 text-text">{c.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                  {c.slug}
                </td>
                <td className="px-4 py-2.5 text-text-muted">{c.order}</td>
                <td className="px-4 py-2.5 text-text-muted">{c.resourceCount}</td>
                <td className="px-4 py-2.5 text-text-muted">{c.locale}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        id: c.id,
                        name: c.name,
                        slug: c.slug,
                        description: c.description,
                        icon: c.icon,
                        order: c.order,
                        locale: c.locale,
                      })
                    }
                    className="mr-3 text-accent hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (c.resourceCount > 0) {
                        toast.error(
                          "Mueve o elimina primero los recursos en esta categoría"
                        );
                        return;
                      }
                      if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
                      deleteCat({ variables: { id: c.id } });
                    }}
                    className="text-red-400 hover:underline"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text">
              {editing.id ? "Editar categoría" : "Nueva categoría"}
            </h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs text-text-muted">Nombre</span>
                <input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((s) =>
                      s
                        ? {
                            ...s,
                            name: e.target.value,
                            slug: s.id ? s.slug : slugify(e.target.value),
                          }
                        : s
                    )
                  }
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-text-muted">Slug</span>
                <input
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, slug: e.target.value } : s))
                  }
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-sm font-mono text-text outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-text-muted">
                  Descripción
                </span>
                <textarea
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((s) =>
                      s ? { ...s, description: e.target.value } : s
                    )
                  }
                  rows={3}
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-text-muted">
                    Icono (lucide)
                  </span>
                  <input
                    value={editing.icon}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, icon: e.target.value } : s))
                    }
                    placeholder="rocket, book, life-buoy…"
                    className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-text-muted">Orden</span>
                  <input
                    type="number"
                    value={editing.order}
                    onChange={(e) =>
                      setEditing((s) =>
                        s
                          ? { ...s, order: Number(e.target.value) || 0 }
                          : s
                      )
                    }
                    className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-text-muted">Idioma</span>
                <select
                  value={editing.locale}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, locale: e.target.value } : s))
                  }
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded border border-border px-3 py-1.5 text-sm text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={creating || updating}
                className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg disabled:opacity-50"
              >
                {creating || updating ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
